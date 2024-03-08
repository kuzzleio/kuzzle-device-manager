import { AssetModelDefinition } from "../../../index";

export const warehouseAssetDefinition: AssetModelDefinition = {
  measures: [{ name: "position", type: "position" }],
  metadataMappings: {
    surface: { type: "integer" },
  },
  defaultMetadata: {
    surface: 500,
  },
  metadataDetails: {
    surface: {
      group: "warehouseSpecifications",
      locales: {
        en: {
          friendlyName: "Surface Area",
          description: "The total surface area of the warehouse",
        },
        fr: {
          friendlyName: "Surface",
          description: "La surface totale de l'entrepôt",
        },
      },
    },
  },
  metadataGroups: {
    warehouseSpecifications: {
      locales: {
        en: {
          groupFriendlyName: "Warehouse Specifications",
        },
        fr: {
          groupFriendlyName: "Spécifications de l'entrepôt",
        },
      },
    },
  },
};
