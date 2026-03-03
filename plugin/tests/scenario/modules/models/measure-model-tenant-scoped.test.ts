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
        "model-measure-tenantTemp",
      ),
    ]);

    // Create all test measures upfront
    // 1. Tenant-scoped measure for engine-ayse
    await sdk.query<ApiModelWriteMeasureRequest>({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "tenantTemp",
        valuesMappings: { tenantTemp: { type: "float" } },
        engines: ["engine-ayse"],
      },
    });

    // 2. Multi-tenant-scoped measure
    await sdk.query<ApiModelWriteMeasureRequest>({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "multiTenantTemp",
        valuesMappings: { multiTenantTemp: { type: "float" } },
        engines: ["engine-kuzzle", "engine-ayse"],
      },
    });

    // 3. Global measure (same type as tenant-scoped, different doc ID)
    await sdk.query<ApiModelWriteMeasureRequest>({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "tenantTemp",
        valuesMappings: { tenantTemp: { type: "float" } },
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
        "model-measure-tenantTemp",
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
      engines: ["engine-ayse"],
      measure: {
        type: "tenantTemp",
        valuesMappings: { tenantTemp: { type: "float" } },
      },
    });
  });

  it("should have created a multi-tenant-scoped measure model with sorted engines in ID", async () => {
    const doc = await sdk.document.get<MeasureModelContent>(
      "device-manager",
      "models",
      "model-measure-engine-ayse+engine-kuzzle-multiTenantTemp",
    );

    expect(doc._source).toMatchObject({
      engines: ["engine-kuzzle", "engine-ayse"],
    });
  });

  it("should have created a global measure model without engines", async () => {
    const doc = await sdk.document.get<MeasureModelContent>(
      "device-manager",
      "models",
      "model-measure-tenantTemp",
    );

    expect(doc._source.engines).toBeUndefined();
    expect(doc._source.measure.type).toBe("tenantTemp");
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
    expect(ids).toContain("model-measure-tenantTemp");
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
    expect(ids).toContain("model-measure-tenantTemp");
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
    expect(ids).toContain("model-measure-tenantTemp");
  });

  it("should get tenant-scoped measure with priority over global", async () => {
    const result = await sdk.query<ApiModelGetMeasureRequest>({
      controller: "device-manager/models",
      action: "getMeasure",
      type: "tenantTemp",
      engineId: "engine-ayse",
    });

    expect(result.result._id).toBe("model-measure-engine-ayse-tenantTemp");
  });

  it("should get global measure when no tenant-scoped override exists", async () => {
    const result = await sdk.query<ApiModelGetMeasureRequest>({
      controller: "device-manager/models",
      action: "getMeasure",
      type: "tenantTemp",
      engineId: "engine-other-group",
    });

    expect(result.result._id).toBe("model-measure-tenantTemp");
  });

  it("should get global measure when no engineId provided", async () => {
    const result = await sdk.query<ApiModelGetMeasureRequest>({
      controller: "device-manager/models",
      action: "getMeasure",
      type: "tenantTemp",
    });

    expect(result.result._id).toBe("model-measure-tenantTemp");
  });

  it("should search tenant-scoped + global measures when engineId provided", async () => {
    const searchResult = await sdk.query<ApiModelSearchMeasuresRequest>({
      controller: "device-manager/models",
      action: "searchMeasures",
      engineId: "engine-ayse",
      body: { query: { term: { "measure.type": "tenantTemp" } } },
    });

    expect(searchResult.result.total).toBe(2);
    const ids = searchResult.result.hits.map((h: { _id: string }) => h._id);
    expect(ids).toContain("model-measure-engine-ayse-tenantTemp");
    expect(ids).toContain("model-measure-tenantTemp");
  });

  it("should search only global measures when no engineId provided", async () => {
    const searchResult = await sdk.query<ApiModelSearchMeasuresRequest>({
      controller: "device-manager/models",
      action: "searchMeasures",
      body: { query: { term: { "measure.type": "tenantTemp" } } },
    });

    expect(searchResult.result.total).toBe(1);
    expect(searchResult.result.hits[0]._id).toBe("model-measure-tenantTemp");
  });

  it("should not allow conflicting mappings between tenant-scoped and global measure", async () => {
    await expect(
      sdk.query<ApiModelWriteMeasureRequest>({
        controller: "device-manager/models",
        action: "writeMeasure",
        body: {
          type: "tenantTemp",
          valuesMappings: { tenantTemp: { type: "integer" } },
          engines: ["engine-kuzzle"],
        },
      }),
    ).rejects.toThrow();
  });

  it("should reject a platform device model referencing a tenant-only measure type", async () => {
    // Create a measure that only exists at tenant scope (no global version)
    await sdk.query<ApiModelWriteMeasureRequest>({
      controller: "device-manager/models",
      action: "writeMeasure",
      body: {
        type: "tenantOnlyMeasure",
        valuesMappings: { tenantOnlyVal: { type: "float" } },
        engines: ["engine-ayse"],
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
