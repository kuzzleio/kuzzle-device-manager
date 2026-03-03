import { vi } from "vitest";

vi.setConfig({ testTimeout: 30000 });

import {
  ApiModelGetMeasureRequest,
  ApiModelListMeasuresRequest,
  ApiModelListMeasuresResult,
  ApiModelSearchMeasuresRequest,
  ApiModelWriteMeasureRequest,
  MeasureModelContent,
} from "../../../../lib/modules/model";
import { setupSdK } from "../../../helpers";

describe("ModelsController:measures:tenant-scoped", () => {
  const sdk = setupSdK();

  beforeAll(async () => {
    // Clean up any leftover test data
    await Promise.allSettled([
      sdk.document.delete(
        "device-manager",
        "models",
        "model-measure-engine-ayse-tenantTemp",
      ),
      sdk.document.delete(
        "device-manager",
        "models",
        "model-measure-engine-ayse+engine-kuzzle-multiTenantTemp",
      ),
      sdk.document.delete(
        "device-manager",
        "models",
        "model-measure-globalTemp",
      ),
    ]);

    // Create test measures — no two types exist at both global and tenant scope
    // 1. Tenant-scoped measure for engine-ayse
    await sdk.query<ApiModelWriteMeasureRequest>({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "tenantTemp",
        valuesMappings: { tenantTemp: { type: "float" } },
        engineIds: ["engine-ayse"],
      },
    });

    // 2. Multi-tenant-scoped measure
    await sdk.query<ApiModelWriteMeasureRequest>({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "multiTenantTemp",
        valuesMappings: { multiTenantTemp: { type: "float" } },
        engineIds: ["engine-kuzzle", "engine-ayse"],
      },
    });

    // 3. Global measure (different type — no shadowing)
    await sdk.query<ApiModelWriteMeasureRequest>({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "globalTemp",
        valuesMappings: { globalTemp: { type: "float" } },
      },
    });

    await sdk.collection.refresh("device-manager", "models");
  });

  afterAll(async () => {
    // Clean up test data
    await Promise.allSettled([
      sdk.document.delete(
        "device-manager",
        "models",
        "model-measure-engine-ayse-tenantTemp",
      ),
      sdk.document.delete(
        "device-manager",
        "models",
        "model-measure-engine-ayse+engine-kuzzle-multiTenantTemp",
      ),
      sdk.document.delete(
        "device-manager",
        "models",
        "model-measure-globalTemp",
      ),
    ]);
  });

  it("should have created a tenant-scoped measure model with correct ID", async () => {
    const doc = await sdk.document.get<MeasureModelContent>(
      "device-manager",
      "models",
      "model-measure-engine-ayse-tenantTemp",
    );

    expect(doc._source).toMatchObject({
      type: "measure",
      engineIds: ["engine-ayse"],
      measure: {
        type: "tenantTemp",
        valuesMappings: { tenantTemp: { type: "float" } },
      },
    });
  });

  it("should have created a multi-tenant-scoped measure model with sorted engineIds in ID", async () => {
    const doc = await sdk.document.get<MeasureModelContent>(
      "device-manager",
      "models",
      "model-measure-engine-ayse+engine-kuzzle-multiTenantTemp",
    );

    expect(doc._source).toMatchObject({
      engineIds: ["engine-kuzzle", "engine-ayse"],
    });
  });

  it("should have created a global measure model without engineIds", async () => {
    const doc = await sdk.document.get<MeasureModelContent>(
      "device-manager",
      "models",
      "model-measure-globalTemp",
    );

    expect(doc._source.engineIds).toBeUndefined();
    expect(doc._source.measure.type).toBe("globalTemp");
  });

  it("should list only global measures when no engineId provided", async () => {
    const listResult = await sdk.query<
      ApiModelListMeasuresRequest,
      ApiModelListMeasuresResult
    >({
      controller: "device-manager/models",
      action: "listMeasures",
    });

    const ids = listResult.result.models.map((m) => m._id);
    expect(ids).not.toContain("model-measure-engine-ayse-tenantTemp");
    expect(ids).not.toContain(
      "model-measure-engine-ayse+engine-kuzzle-multiTenantTemp",
    );
    expect(ids).toContain("model-measure-globalTemp");
  });

  it("should list tenant-scoped + global measures when engineId provided", async () => {
    const listResult = await sdk.query<
      ApiModelListMeasuresRequest,
      ApiModelListMeasuresResult
    >({
      controller: "device-manager/models",
      action: "listMeasures",
      engineId: "engine-ayse",
    });

    const ids = listResult.result.models.map((m) => m._id);
    expect(ids).toContain("model-measure-engine-ayse-tenantTemp");
    expect(ids).toContain(
      "model-measure-engine-ayse+engine-kuzzle-multiTenantTemp",
    );
    expect(ids).toContain("model-measure-globalTemp");
  });

  it("should not list measures scoped to other tenants", async () => {
    const listResult = await sdk.query<
      ApiModelListMeasuresRequest,
      ApiModelListMeasuresResult
    >({
      controller: "device-manager/models",
      action: "listMeasures",
      engineId: "engine-other-group",
    });

    const ids = listResult.result.models.map((m) => m._id);
    expect(ids).not.toContain("model-measure-engine-ayse-tenantTemp");
    expect(ids).toContain("model-measure-globalTemp");
  });

  it("should get tenant-scoped measure when engineId matches", async () => {
    const result = await sdk.query<ApiModelGetMeasureRequest>({
      controller: "device-manager/models",
      action: "getMeasure",
      type: "tenantTemp",
      engineId: "engine-ayse",
    });

    expect(result.result._id).toBe("model-measure-engine-ayse-tenantTemp");
  });

  it("should get global measure when no engineId provided", async () => {
    const result = await sdk.query<ApiModelGetMeasureRequest>({
      controller: "device-manager/models",
      action: "getMeasure",
      type: "globalTemp",
    });

    expect(result.result._id).toBe("model-measure-globalTemp");
  });

  it("should not find tenant-scoped measure without engineId", async () => {
    await expect(
      sdk.query<ApiModelGetMeasureRequest>({
        controller: "device-manager/models",
        action: "getMeasure",
        type: "tenantTemp",
      }),
    ).rejects.toThrow();
  });

  it("should search tenant-scoped + global measures when engineId provided", async () => {
    const searchResult = await sdk.query<ApiModelSearchMeasuresRequest>({
      controller: "device-manager/models",
      action: "searchMeasures",
      engineId: "engine-ayse",
      body: {
        query: {
          bool: {
            should: [
              { term: { "measure.type": "tenantTemp" } },
              { term: { "measure.type": "globalTemp" } },
            ],
          },
        },
      },
    });

    const ids = searchResult.result.hits.map((h: { _id: string }) => h._id);
    expect(ids).toContain("model-measure-engine-ayse-tenantTemp");
    expect(ids).toContain("model-measure-globalTemp");
  });

  it("should search only global measures when no engineId provided", async () => {
    const searchResult = await sdk.query<ApiModelSearchMeasuresRequest>({
      controller: "device-manager/models",
      action: "searchMeasures",
      body: {
        query: {
          bool: {
            should: [
              { term: { "measure.type": "tenantTemp" } },
              { term: { "measure.type": "globalTemp" } },
            ],
          },
        },
      },
    });

    expect(searchResult.result.total).toBe(1);
    expect(searchResult.result.hits[0]._id).toBe("model-measure-globalTemp");
  });

  it("should reject creating a tenant-scoped measure when global with same type exists", async () => {
    await expect(
      sdk.query<ApiModelWriteMeasureRequest>({
        controller: "device-manager/models",
        action: "writeMeasure",
        body: {
          type: "globalTemp",
          valuesMappings: { globalTemp: { type: "float" } },
          engineIds: ["engine-kuzzle"],
        },
      }),
    ).rejects.toThrow(/already exists as a global measure/);
  });

  it("should reject creating a global measure when tenant-scoped with same type exists", async () => {
    await expect(
      sdk.query<ApiModelWriteMeasureRequest>({
        controller: "device-manager/models",
        action: "writeMeasure",
        body: {
          type: "tenantTemp",
          valuesMappings: { tenantTemp: { type: "float" } },
        },
      }),
    ).rejects.toThrow(/already exists as a tenant-scoped measure/);
  });

  it("should allow two tenant-scoped measures with same type for different tenants", async () => {
    await sdk.query<ApiModelWriteMeasureRequest>({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "tenantTemp",
        valuesMappings: { tenantTemp: { type: "float" } },
        engineIds: ["engine-other"],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const doc = await sdk.document.get<MeasureModelContent>(
      "device-manager",
      "models",
      "model-measure-engine-other-tenantTemp",
    );
    expect(doc._source.engineIds).toEqual(["engine-other"]);

    // Cleanup
    await sdk.document.delete(
      "device-manager",
      "models",
      "model-measure-engine-other-tenantTemp",
    );
  });

  it("should reject a platform device model referencing a tenant-only measure type", async () => {
    // Create a measure that only exists at tenant scope (no global version)
    await sdk.query<ApiModelWriteMeasureRequest>({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "tenantOnlyMeasure",
        valuesMappings: { tenantOnlyVal: { type: "float" } },
        engineIds: ["engine-ayse"],
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    // A platform-level device model referencing that tenant-only measure should fail
    await expect(
      sdk.query({
        controller: "device-manager/models",
        action: "writeDevice",
        body: {
          model: "TenantOnlyDevice",
          measures: [{ type: "tenantOnlyMeasure", name: "tenantOnly" }],
          metadataMappings: {},
        },
      }),
    ).rejects.toThrow(/Cannot find measure "tenantOnlyMeasure"/);

    // Cleanup
    await Promise.allSettled([
      sdk.document.delete(
        "device-manager",
        "models",
        "model-measure-engine-ayse-tenantOnlyMeasure",
      ),
      sdk.document.delete(
        "device-manager",
        "models",
        "model-device-TenantOnlyDevice",
      ),
    ]);
  });
});
