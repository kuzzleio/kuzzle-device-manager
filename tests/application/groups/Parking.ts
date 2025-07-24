import { GroupContent } from "lib/modules/group/exports";
import { GroupModel, Metadata } from "lib/modules/shared";

const modelName = "Parking";

export interface ParkingMetadata extends Metadata {
  geolocation: {
    lat: number;
    lon: number;
  };
}

export interface ParkingGroupContent extends GroupContent<ParkingMetadata> {
  model: typeof modelName;
}

export const Parking: GroupModel = {
  modelName,
  definition: {
    affinity: {
      type: ["assets"],
      models: { assets: [] },
      strict: false,
    },
    metadataMappings: {
      geolocation: { type: "geo_point" },
    },
    metadataDetails: {
      geolocation: {
        group: "environment",
        locales: {
          en: {
            friendlyName: "Geolocation",
            description: "Parking geolocation",
          },
          fr: {
            friendlyName: "Géolocalisation",
            description: "Géolocalisation du parking",
          },
        },
      },
    },
    defaultMetadata: {
      geolocation: {
        lon: 3.8761,
        lat: 43.6109,
      },
    },
    metadataGroups: {
      environment: {
        locales: {
          en: {
            groupFriendlyName: "Environmental information",
            description: "All environmental relative information",
          },
          fr: {
            groupFriendlyName: "Informations environnementales",
            description:
              "Toutes les informations liées a l'environement du parking",
          },
        },
      },
    },
  },
};
