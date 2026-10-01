import { EditorHintEnum, MetadataReferentialEntry } from "../../index";

export const metadataReferential: Array<{
  name: string;
  definition: MetadataReferentialEntry;
}> = [
  {
    name: "serialNumber",
    definition: {
      mappings: { type: "keyword" },
      locales: {
        en: { friendlyName: "Serial number", description: "Serial number" },
        fr: {
          friendlyName: "Numéro de série",
          description: "Numéro de série",
        },
      },
    },
  },
  {
    name: "manufacturer",
    definition: {
      mappings: {
        properties: {
          name: { type: "keyword" },
          country: { type: "keyword" },
        },
      },
      locales: {
        en: { friendlyName: "Manufacturer", description: "Manufacturer" },
        fr: { friendlyName: "Fabricant", description: "Fabricant" },
      },
    },
  },
  {
    name: "installationPosition",
    definition: {
      mappings: { type: "geo_point" },
      locales: {
        en: {
          friendlyName: "Installation position",
          description: "Where it is installed",
        },
      },
    },
  },
  {
    name: "operatingStatus",
    definition: {
      mappings: { type: "keyword" },
      locales: {
        en: { friendlyName: "Status", description: "Operating status" },
        fr: { friendlyName: "Statut", description: "Statut de fonctionnement" },
      },
      editorHint: {
        type: EditorHintEnum.OPTION_SELECTOR,
        values: ["active", "inactive"],
      },
      defaultValue: "active",
    },
  },
];
