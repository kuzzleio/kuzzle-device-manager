import { vi } from "vitest";
import { ModelsRegister } from "../../lib/modules/model/ModelsRegister";
import { MetadataReferential } from "../../lib/modules/model/types/ModelContent";

/**
 * Startup loading of the metadata referential registered from code
 */
describe("ModelsRegister: metadata referential at startup", () => {
  let ask: ReturnType<typeof vi.fn>;

  function setup({
    stored = {},
    storedModels = [],
    esConflicts = [],
  }: {
    stored?: MetadataReferential;
    storedModels?: object[];
    esConflicts?: object[];
  }) {
    ask = vi.fn(async () => esConflicts);
    (global as any).kuzzle = { ask };

    const logger = { info: vi.fn(), warn: vi.fn() };
    const sdk = {
      collection: { refresh: vi.fn() },
      document: {
        createOrReplace: vi.fn(),
        get: vi.fn(async () => ({ _source: { metadata: stored } })),
        mCreateOrReplace: vi.fn(),
        search: vi.fn(async () => ({
          hits: storedModels.map((_source, i) => ({ _id: `m${i}`, _source })),
          next: async () => null,
        })),
      },
    };

    const register = new ModelsRegister();
    register.init({
      config: { platformIndex: "device-manager" },
      context: {
        accessors: { sdk },
        logger: { child: () => logger },
      },
    } as any);

    return { register, sdk };
  }

  afterEach(() => {
    delete (global as any).kuzzle;
  });

  it("Rejects an entry whose mappings differ from the stored ones", async () => {
    const { register } = setup({
      stored: { color: { locales: {}, mappings: { type: "keyword" } } },
    });

    register.registerMetadata("color", {
      locales: {},
      mappings: { type: "integer" },
    });

    await expect(register.loadModels()).rejects.toThrow(
      'The mappings of metadata "color" cannot be modified',
    );
  });

  it("Rejects a new entry conflicting with an inline metadata of a stored model", async () => {
    const { register } = setup({
      storedModels: [
        {
          asset: {
            measures: [],
            metadataMappings: { color: { type: "integer" } },
            model: "Container",
          },
          type: "asset",
        },
      ],
    });

    register.registerMetadata("color", {
      locales: {},
      mappings: { type: "keyword" },
    });

    await expect(register.loadModels()).rejects.toThrow(
      "Metadata registered from code conflict with the existing mappings",
    );
  });

  it("Rejects a new entry conflicting with the engines collections mappings", async () => {
    const { register } = setup({
      esConflicts: [
        {
          conflicts: [{ path: "assets.metadata.color.type" }],
          modelType: "metadata",
          newModel: "metadata-referential",
          sourceModel: "engine-ayse/assets",
        },
      ],
    });

    register.registerMetadata("color", {
      locales: {},
      mappings: { type: "keyword" },
    });

    await expect(register.loadModels()).rejects.toThrow(
      "Metadata registered from code conflict with the existing mappings",
    );
    expect(ask).toHaveBeenCalledWith(
      "ask:device-manager:engine:doesMetadataConflict",
      { metadataMappings: { color: { type: "keyword" } } },
    );
  });

  it("Saves a new entry as managed and keeps the stored ones editable", async () => {
    const { register, sdk } = setup({
      stored: {
        size: { locales: {}, managed: true, mappings: { type: "integer" } },
      },
    });

    register.registerMetadata("color", {
      locales: {},
      mappings: { type: "keyword" },
    });

    await register.loadModels();

    expect(sdk.document.createOrReplace).toHaveBeenCalledWith(
      "device-manager",
      "models",
      "model-metadata-referential",
      {
        metadata: {
          color: { locales: {}, managed: true, mappings: { type: "keyword" } },
          size: { locales: {}, mappings: { type: "integer" } },
        },
        type: "metadata-referential",
      },
      { refresh: "wait_for" },
    );
  });

  it("Does not check the entries already stored with the same mappings", async () => {
    const { register } = setup({
      stored: { color: { locales: {}, mappings: { type: "keyword" } } },
    });

    register.registerMetadata("color", {
      locales: { en: { description: "", friendlyName: "Color" } },
      mappings: { type: "keyword" },
    });

    await register.loadModels();

    expect(ask).not.toHaveBeenCalled();
  });

  it("Rejects a model registered from code using an unknown referential metadata", async () => {
    const { register } = setup({});

    register.registerAsset(["commons"], "Container", [], {
      color: { referential: true },
    });

    await expect(register.loadModels()).rejects.toThrow(
      'uses the unknown referential metadata "color"',
    );
  });
});
