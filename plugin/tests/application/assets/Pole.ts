import { AssetModel } from "../../../index";

/**
 * Asset model using the metadata referential
 */
export const Pole: AssetModel = {
  modelName: "Pole",
  definition: {
    measures: [{ name: "position", type: "position" }],
    metadataMappings: {
      height: { type: "integer" },
      serialNumber: { referential: true },
      manufacturer: { referential: true },
      operatingStatus: { referential: true },
    },
    metadataDetails: {
      manufacturer: {
        locales: {
          en: { friendlyName: "Pole maker", description: "Pole maker" },
        },
      },
      operatingStatus: { group: "state", locales: {} },
    },
    defaultMetadata: {
      operatingStatus: "inactive",
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
