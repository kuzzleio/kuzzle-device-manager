import {
  checkMetadataReferentialEntry,
  enrichModelMetadata,
  getAddedInlineMetadata,
  getEntryModelsConflicts,
  resolveMetadataMappings,
} from "../../lib/modules/model/MetadataReferential";
import { findMappingsConflicts } from "../../lib/modules/model/ModelsConflicts";
import {
  AssetModelContent,
  MetadataReferential,
} from "../../lib/modules/model/types/ModelContent";

const referential: MetadataReferential = {
  width: {
    mappings: { type: "float" },
    locales: { en: { friendlyName: "Width", description: "Width" } },
    icon: "ruler",
    defaultValue: 1,
  },
};

const context = {
  createError: (message: string) => new Error(message),
  model: "Container",
  modelType: "asset" as const,
};

function assetModel(metadataMappings: object): AssetModelContent {
  return {
    asset: {
      defaultMetadata: {},
      measures: [],
      metadataMappings,
      model: "Container",
    },
    tenantClasses: ["commons"],
    type: "asset",
  } as AssetModelContent;
}

describe("enrichModelMetadata", () => {
  it("Keeps the marker and enriches the details and default value", () => {
    const { fields, resolvedMappings, warnings } = enrichModelMetadata(
      referential,
      { metadataMappings: { width: { referential: true } } },
      context,
    );

    expect(fields).toEqual({
      defaultMetadata: { width: 1 },
      metadataDetails: {
        width: {
          icon: "ruler",
          locales: { en: { friendlyName: "Width", description: "Width" } },
        },
      },
      metadataMappings: { width: { referential: true } },
    });
    expect(resolvedMappings).toEqual({ width: { type: "float" } });
    expect(warnings).toEqual([]);
  });

  it("Lets the model details and default value take precedence", () => {
    const { fields } = enrichModelMetadata(
      referential,
      {
        defaultMetadata: { width: 2 },
        metadataDetails: {
          width: {
            group: "size",
            icon: "arrows",
            locales: { en: { friendlyName: "Size", description: "" } },
          },
        },
        metadataMappings: { width: { referential: true } },
      },
      context,
    );

    expect(fields.defaultMetadata).toEqual({ width: 2 });
    expect(fields.metadataDetails.width).toEqual({
      group: "size",
      icon: "arrows",
      locales: { en: { friendlyName: "Size", description: "" } },
    });
  });

  it("Rejects an unknown or malformed marker", () => {
    expect(() =>
      enrichModelMetadata(
        referential,
        { metadataMappings: { height: { referential: true } } },
        context,
      ),
    ).toThrow('uses the unknown referential metadata "height"');

    expect(() =>
      enrichModelMetadata(
        referential,
        { metadataMappings: { width: { referential: false } as any } },
        context,
      ),
    ).toThrow("must be { referential: true }");
  });

  it("Rejects an inline metadata differing from the referential", () => {
    expect(() =>
      enrichModelMetadata(
        referential,
        { metadataMappings: { width: { type: "integer" } } },
        context,
      ),
    ).toThrow("conflict with the metadata referential");
  });

  it("Warns about an inline metadata identical to the referential", () => {
    const { warnings } = enrichModelMetadata(
      referential,
      { metadataMappings: { width: { type: "float" } } },
      context,
    );

    expect(warnings).toHaveLength(1);
  });
});

describe("resolveMetadataMappings", () => {
  it("Replaces the markers by the referential mappings", () => {
    expect(
      resolveMetadataMappings(referential, {
        color: { type: "keyword" },
        removed: { referential: true },
        width: { referential: true },
      }),
    ).toEqual({ color: { type: "keyword" }, width: { type: "float" } });
  });
});

describe("getEntryModelsConflicts", () => {
  it("Lists the models defining the metadata inline differently", () => {
    const chunks = getEntryModelsConflicts("width", referential.width, [
      assetModel({ width: { type: "keyword" } }),
      assetModel({ width: { type: "float" } }),
      assetModel({ width: { referential: true } }),
    ]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].conflicts).toEqual([
      {
        currentType: "float",
        newType: "keyword",
        path: "asset.metadataMappings.width.type",
      },
    ]);
  });
});

describe("findMappingsConflicts", () => {
  it("Detects a type change", () => {
    expect(
      findMappingsConflicts(
        { a: { type: "keyword" } },
        { a: { type: "integer" } },
      ),
    ).toEqual([{ currentType: "keyword", newType: "integer", path: "a.type" }]);
  });

  it("Detects a value becoming an object and the opposite", () => {
    const object = { properties: { b: { type: "keyword" } } };

    expect(
      findMappingsConflicts({ a: { type: "keyword" } }, { a: object }),
    ).toEqual([{ currentType: "keyword", newType: "object", path: "a" }]);
    expect(
      findMappingsConflicts({ a: object }, { a: { type: "keyword" } }),
    ).toEqual([{ currentType: "object", newType: "keyword", path: "a" }]);
  });

  it("Detects nested conflicts and accepts new properties", () => {
    expect(
      findMappingsConflicts(
        { a: { properties: { b: { type: "keyword" } } } },
        {
          a: {
            properties: { b: { type: "integer" }, c: { type: "keyword" } },
          },
          d: { type: "keyword" },
        },
      ),
    ).toEqual([
      {
        currentType: "keyword",
        newType: "integer",
        path: "a.properties.b.type",
      },
    ]);
  });

  it("Detects an object becoming nested", () => {
    expect(
      findMappingsConflicts(
        { a: { properties: {} } },
        { a: { type: "nested", properties: {} } },
      ),
    ).toEqual([{ currentType: "object", newType: "nested", path: "a.type" }]);
  });
});

describe("getAddedInlineMetadata", () => {
  it("Lists every inline metadata of a new model", () => {
    expect(
      getAddedInlineMetadata(
        { color: { type: "keyword" }, width: { referential: true } },
        null,
      ),
    ).toEqual(["color"]);
  });

  it("Keeps the inline metadata of the stored model", () => {
    expect(
      getAddedInlineMetadata(
        { color: { type: "keyword" }, size: { type: "integer" } },
        assetModel({ color: { type: "keyword" } }),
      ),
    ).toEqual(["size"]);
  });

  it("Does not consider a referential metadata of the stored model as inline", () => {
    expect(
      getAddedInlineMetadata(
        { width: { type: "float" } },
        assetModel({ width: { referential: true } }),
      ),
    ).toEqual(["width"]);
  });
});

describe("checkMetadataReferentialEntry", () => {
  const createError = (message: string) => new Error(message);

  it("Rejects an icon that is not a string", () => {
    expect(() =>
      checkMetadataReferentialEntry(
        "width",
        { icon: 42 as any, locales: {}, mappings: { type: "float" } },
        createError,
      ),
    ).toThrow('Metadata "width" icon must be a string');
  });
});
