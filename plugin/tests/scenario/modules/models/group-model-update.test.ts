import { vi } from "vitest";
import {
  ApiModelUpdateGroupRequest,
  ApiModelUpdateGroupResult,
  ApiModelWriteGroupRequest,
} from "../../../../lib/modules/model";
import { setupHooks } from "../../../helpers";

vi.setConfig({ testTimeout: 30000 });

describe("ModelsController:updateGroup", () => {
  const sdk = setupHooks();

  const affinity = {
    type: ["assets"],
    models: { assets: ["Container"], devices: [] },
    strict: true,
  };

  async function writeFleet() {
    await sdk.query<ApiModelWriteGroupRequest>({
      controller: "device-manager/models",
      action: "writeGroup",
      body: {
        affinity,
        engineGroups: ["commons"],
        icon: "truck",
        model: "UpdFleet",
        metadataMappings: { updFleetSize: { type: "integer" } },
      },
    });

    for (const engineId of ["engine-ayse", "engine-other-group"]) {
      await sdk.query({
        controller: "device-manager/groups",
        action: "create",
        engineId,
        _id: "upd-fleet",
        body: {
          name: "upd fleet",
          model: "UpdFleet",
          metadata: { updFleetSize: 3 },
        },
      });
    }
  }

  async function updateFleet(
    body: ApiModelUpdateGroupRequest["body"],
  ): Promise<ApiModelUpdateGroupResult> {
    const { result } = await sdk.query<
      ApiModelUpdateGroupRequest,
      ApiModelUpdateGroupResult
    >({
      controller: "device-manager/models",
      action: "updateGroup",
      engineGroups: ["commons"],
      model: "UpdFleet",
      body,
    });

    return result;
  }

  async function getGroupMetadata(engineId: string) {
    const { result } = await sdk.query({
      controller: "device-manager/groups",
      action: "get",
      engineId,
      _id: "upd-fleet",
    });

    return result._source.metadata;
  }

  it("should update the model, keep its scope and refresh the groups of every engine", async () => {
    await writeFleet();

    const updated = await updateFleet({
      metadataMappings: {
        updFleetSize: { type: "integer" },
        updFleetSector: { type: "keyword" },
      },
      defaultValues: { updFleetSector: "north" },
    });

    expect(updated._id).toBe("model-group-UpdFleet");
    expect(updated._source).toMatchObject({
      engineGroups: ["commons"],
      group: {
        affinity,
        icon: "truck",
        metadataMappings: {
          updFleetSize: { type: "integer" },
          updFleetSector: { type: "keyword" },
        },
        defaultMetadata: { updFleetSector: "north" },
      },
    });

    for (const engineId of ["engine-ayse", "engine-other-group"]) {
      await expect(getGroupMetadata(engineId)).resolves.toEqual({
        updFleetSize: 3,
        updFleetSector: "north",
      });
    }

    await updateFleet({
      metadataMappings: { updFleetSector: { type: "keyword" } },
    });

    await expect(getGroupMetadata("engine-ayse")).resolves.toEqual({
      updFleetSector: "north",
    });
  });

  it("should keep the metadata references when omitted and remove them when sent", async () => {
    await writeFleet();

    const referenced = await updateFleet({
      metadataMappings: { updFleetSize: { type: "integer" } },
      metadata: { operatingStatus: true },
    });
    expect(referenced._source.group.metadataReferences).toEqual({
      operatingStatus: true,
    });
    expect(referenced._source.group.metadataMappings).toMatchObject({
      operatingStatus: { type: "keyword" },
    });
    await expect(getGroupMetadata("engine-ayse")).resolves.toEqual({
      updFleetSize: 3,
      operatingStatus: "active",
    });

    const kept = await updateFleet({
      metadataMappings: { updFleetSize: { type: "integer" } },
    });
    expect(kept._source.group.metadataReferences).toEqual({
      operatingStatus: true,
    });

    const removed = await updateFleet({
      metadataMappings: { updFleetSize: { type: "integer" } },
      metadata: {},
    });
    expect(removed._source.group.metadataReferences).toEqual({});
    expect(removed._source.group.metadataMappings).toEqual({
      updFleetSize: { type: "integer" },
    });
    await expect(getGroupMetadata("engine-ayse")).resolves.toEqual({
      updFleetSize: 3,
    });
  });

  it("should reject a conflicting update and leave the model untouched", async () => {
    await writeFleet();

    await expect(
      updateFleet({
        metadataMappings: { updFleetSize: { type: "keyword" } },
      }),
    ).rejects.toMatchObject({ status: 409 });

    const model = await sdk.document.get(
      "device-manager",
      "models",
      "model-group-UpdFleet",
    );
    expect(model._source.group.metadataMappings).toEqual({
      updFleetSize: { type: "integer" },
    });
  });

  it("should reject an unknown group model", async () => {
    await expect(
      sdk.query<ApiModelUpdateGroupRequest>({
        controller: "device-manager/models",
        action: "updateGroup",
        engineGroups: ["commons"],
        model: "UpdUnknown",
        body: {},
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
