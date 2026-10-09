import { AssetModel } from "../../../index";

/**
 * Asset model referencing the metadata referential
 */
export const Pole: AssetModel = {
  modelName: "Pole",
  definition: {
    measures: [{ name: "position", type: "position" }],
    metadataMappings: {
      height: { type: "integer" },
    },
    metadata: {
      serialNumber: true,
      manufacturer: {
        locales: {
          en: { friendlyName: "Pole maker", description: "Pole maker" },
        },
      },
      operatingStatus: { defaultValue: "inactive", group: "state" },
    },
    metadataGroups: {
      state: {
        locales: {
          en: { groupFriendlyName: "State", description: "Pole state" },
        },
      },
    },
  },
};
