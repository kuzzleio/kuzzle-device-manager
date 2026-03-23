import { setupHooks } from "../../../helpers";

describe("ModelsController:actions", () => {
  const sdk = setupHooks();

  beforeAll(async () => {
    await Promise.allSettled([
      sdk.document.delete("device-manager", "models", "model-action-valve"),
      sdk.document.delete(
        "device-manager",
        "models",
        "model-action-thermostat",
      ),
    ]);
  });

  it("Write and List an Action model", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAction",
      body: {
        type: "valve",
        argsSchema: {
          type: "object",
          properties: {
            position: { type: "number", minimum: 0, maximum: 100 },
          },
          required: ["position"],
        },
        locales: {
          en: {
            friendlyName: "Valve control",
            description: "Open or close a valve",
          },
          fr: {
            friendlyName: "Contrôle de vanne",
            description: "Ouvrir ou fermer une vanne",
          },
        },
      },
    });

    const modelContent = await sdk.document.get(
      "device-manager",
      "models",
      "model-action-valve",
    );
    expect(modelContent._source).toMatchObject({
      type: "action",
      action: {
        type: "valve",
        argsSchema: {
          type: "object",
          properties: {
            position: { type: "number", minimum: 0, maximum: 100 },
          },
          required: ["position"],
        },
        locales: {
          en: {
            friendlyName: "Valve control",
            description: "Open or close a valve",
          },
        },
      },
    });

    await sdk.query({
      controller: "device-manager/models",
      action: "writeAction",
      body: {
        type: "thermostat",
        argsSchema: {
          type: "object",
          properties: {
            targetTemperature: { type: "number" },
          },
        },
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const listActions = await sdk.query({
      controller: "device-manager/models",
      action: "listActions",
    });

    expect(listActions.result.total).toBeGreaterThanOrEqual(2);
    const actionIds = listActions.result.models.map(
      (m: { _id: string }) => m._id,
    );
    expect(actionIds).toContain("model-action-valve");
    expect(actionIds).toContain("model-action-thermostat");
  });

  it("Get an Action model", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAction",
      body: {
        type: "valve",
        argsSchema: { type: "object" },
      },
    });

    const getAction = await sdk.query({
      controller: "device-manager/models",
      action: "getAction",
      type: "valve",
    });

    expect(getAction.result).toMatchObject({
      _id: "model-action-valve",
      _source: {
        type: "action",
        action: { type: "valve" },
      },
    });
  });

  it("Search Action models", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAction",
      body: {
        type: "valve",
        argsSchema: { type: "object" },
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const searchActions = await sdk.query({
      controller: "device-manager/models",
      action: "searchActions",
      body: { query: { match: { "action.type": "valve" } } },
    });

    expect(searchActions.result).toMatchObject({
      total: 1,
      hits: [{ _id: "model-action-valve" }],
    });
  });

  it("Delete an Action model", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAction",
      body: {
        type: "toDelete",
        argsSchema: {},
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    await sdk.query({
      controller: "device-manager/models",
      action: "deleteAction",
      _id: "model-action-toDelete",
    });

    await expect(
      sdk.document.get("device-manager", "models", "model-action-toDelete"),
    ).rejects.toThrow();
  });

  it("Update an existing Action model", async () => {
    await sdk.query({
      controller: "device-manager/models",
      action: "writeAction",
      body: {
        type: "valve",
        argsSchema: {
          type: "object",
          properties: {
            position: { type: "number", minimum: 0, maximum: 100 },
            force: { type: "boolean" },
          },
        },
      },
    });

    const updated = await sdk.document.get(
      "device-manager",
      "models",
      "model-action-valve",
    );
    expect(updated._source).toMatchObject({
      action: {
        type: "valve",
        argsSchema: {
          properties: {
            position: { type: "number", minimum: 0, maximum: 100 },
            force: { type: "boolean" },
          },
        },
      },
    });
  });

  it("Actions collection exists in engines", async () => {
    const collections = await sdk.collection.list("engine-kuzzle");
    const collectionNames = collections.collections.map(
      (c: { name: string }) => c.name,
    );
    expect(collectionNames).toContain("actions");
  });
});
