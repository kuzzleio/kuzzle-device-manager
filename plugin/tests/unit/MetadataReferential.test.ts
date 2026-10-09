import {
  checkMetadataReferentialEntry,
  getAddedInlineMetadata,
  resolveMetadataReferences,
} from "../../lib/modules/model/MetadataReferential";
import { AssetModelContent } from "../../lib/modules/model/types/ModelContent";
import { MetadataReferential } from "../../lib/modules/model/types/ModelContent";

describe("resolveMetadataReferences", () => {
  const referential: MetadataReferential = {
    width: {
      mappings: { type: "float" },
      locales: { en: { friendlyName: "Width", description: "Width" } },
    },
  };
  const context = {
    createError: (message: string) => new Error(message),
    model: "Container",
    modelType: "asset" as const,
  };

  it("Reports inline default values differing for a referenced metadata", () => {
    const { fields, ignored, warnings } = resolveMetadataReferences(
      referential,
      { defaultMetadata: { width: 2.33 }, metadataReferences: { width: true } },
      context,
    );

    expect(fields.defaultMetadata).toEqual({});
    expect(warnings).toEqual([]);
    expect(ignored).toEqual([
      expect.stringContaining(
        'inline default value of the referenced metadata "width"',
      ),
    ]);
  });

  it("Reports inline details differing for a referenced metadata", () => {
    const { ignored, warnings } = resolveMetadataReferences(
      referential,
      {
        metadataDetails: {
          width: { locales: { en: { friendlyName: "W", description: "" } } },
        },
        metadataReferences: { width: true },
      },
      context,
    );

    expect(warnings).toEqual([]);
    expect(ignored).toEqual([
      expect.stringContaining(
        'inline details of the referenced metadata "width"',
      ),
    ]);
  });

  it("Does not warn about inline values identical to the resolved ones", () => {
    const first = resolveMetadataReferences(
      referential,
      { metadataReferences: { width: { defaultValue: 1 } } },
      context,
    );
    const { ignored, warnings } = resolveMetadataReferences(
      referential,
      first.fields,
      context,
    );

    expect(warnings).toEqual([]);
    expect(ignored).toEqual([]);
  });

  describe("icon", () => {
    const iconReferential: MetadataReferential = {
      ...referential,
      height: {
        mappings: { type: "float" },
        locales: {},
        icon: "ruler-vertical",
      },
    };

    it("Resolves the referential icon into the metadata details", () => {
      const { fields } = resolveMetadataReferences(
        iconReferential,
        { metadataReferences: { height: true, width: true } },
        context,
      );

      expect(fields.metadataDetails.height.icon).toBe("ruler-vertical");
      expect(fields.metadataDetails.width).not.toHaveProperty("icon");
    });

    it("Lets the reference override the referential icon", () => {
      const { fields } = resolveMetadataReferences(
        iconReferential,
        {
          metadataReferences: {
            height: { icon: "arrows-up-down" },
            width: { icon: "arrows-left-right" },
          },
        },
        context,
      );

      expect(fields.metadataDetails.height.icon).toBe("arrows-up-down");
      expect(fields.metadataDetails.width.icon).toBe("arrows-left-right");
    });

    it("Keeps the icon of an inline metadata", () => {
      const { fields } = resolveMetadataReferences(
        iconReferential,
        {
          metadataMappings: { depth: { type: "float" } },
          metadataDetails: { depth: { locales: {}, icon: "cube" } },
        },
        context,
      );

      expect(fields.metadataDetails.depth.icon).toBe("cube");
    });

    it("Does not warn about a resolved icon sent back", () => {
      const first = resolveMetadataReferences(
        iconReferential,
        { metadataReferences: { height: true } },
        context,
      );
      const { ignored, warnings } = resolveMetadataReferences(
        iconReferential,
        first.fields,
        context,
      );

      expect(warnings).toEqual([]);
      expect(ignored).toEqual([]);
    });

    it("Rejects an icon that is not a string", () => {
      expect(() =>
        resolveMetadataReferences(
          iconReferential,
          { metadataReferences: { height: { icon: 42 as any } } },
          context,
        ),
      ).toThrow(/icon of the reference to metadata "height".*must be a string/);

      expect(() =>
        checkMetadataReferentialEntry(
          "height",
          { mappings: { type: "float" }, locales: {}, icon: 42 as any },
          (message) => new Error(message),
        ),
      ).toThrow('Metadata "height" icon must be a string');
    });
  });
});

describe("getAddedInlineMetadata", () => {
  const stored = {
    type: "asset",
    engineGroups: ["commons"],
    asset: {
      model: "Container",
      measures: [],
      metadataMappings: {
        legacy: { type: "keyword" },
        width: { type: "float" },
      },
      metadataDetails: {},
      defaultMetadata: {},
      metadataReferences: { width: true },
    },
  } as unknown as AssetModelContent;

  it("Lists every inline metadata of a new model", () => {
    expect(
      getAddedInlineMetadata(
        { legacy: { type: "keyword" }, depth: { type: "float" } },
        {},
        null,
      ),
    ).toEqual(["legacy", "depth"]);
  });

  it("Keeps the inline metadata of the stored model and the referenced ones", () => {
    expect(
      getAddedInlineMetadata(
        {
          legacy: { type: "keyword" },
          width: { type: "float" },
          depth: { type: "float" },
        },
        { width: true },
        stored,
      ),
    ).toEqual(["depth"]);
  });

  it("Does not consider a resolved reference of the stored model as inline", () => {
    // ? width was resolved from a reference, it cannot come back as an inline metadata
    expect(
      getAddedInlineMetadata({ width: { type: "float" } }, {}, stored),
    ).toEqual(["width"]);
  });
});
