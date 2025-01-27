import {
  ApiModelGetGroupRequest,
  ApiModelListGroupsRequest,
  ApiModelSearchGroupsRequest,
  ApiModelWriteGroupRequest,
} from "../../../../lib/modules/model";
import { setupHooks } from "../../../helpers";

jest.setTimeout(20000);

describe("ModelsController:groups", () => {
  const sdk = setupHooks();

  it("Write and List a Group model", async () => {
    await sdk.query<ApiModelWriteGroupRequest>({
      controller: "device-manager/models",
      action: "writeGroup",
      body: {
        engineGroup: "air_quality",
        model: "TruckFleet",
        metadataMappings: {
          size: { type: "integer" },
        },
        metadataDetails: {
          size: {
            locales: {
              en: {
                friendlyName: "Truck fleet size",
                description: "The number of trucks in the fleet",
              },
              fr: {
                friendlyName: "Taille de la flotte",
                description: "Le nombre de camions dans la flotte",
              },
            },
          },
        },
      },
    });

    const groupModel1 = await sdk.document.get(
      "device-manager",
      "models",
      "model-group-TruckFleet",
    );
    expect(groupModel1._source).toMatchObject({
      type: "group",
      engineGroup: "air_quality",
      group: {
        model: "TruckFleet",
        metadataMappings: {
          size: { type: "integer" },
        },
        metadataDetails: {
          size: {
            locales: {
              en: {
                friendlyName: "Truck fleet size",
                description: "The number of trucks in the fleet",
              },
              fr: {
                friendlyName: "Taille de la flotte",
                description: "Le nombre de camions dans la flotte",
              },
            },
          },
        },
      },
    });

    await sdk.query<ApiModelWriteGroupRequest>({
      controller: "device-manager/models",
      action: "writeGroup",
      body: {
        engineGroup: "air_quality",
        model: "TruckFleet",
        metadataMappings: {
          sector: { type: "keyword" },
          zone: { type: "geo_shape" },
          size: { type: "integer" },
        },
        metadataDetails: {
          sector: {
            group: "delimitation",
            locales: {
              en: {
                friendlyName: "Geographic sector name",
                description:
                  "The name of the geographic sector of activity of the fleet",
              },
              fr: {
                friendlyName: "Nom de la zone d'activité",
                description:
                  "Le nom de la  zone géographique d'activité de la zone",
              },
            },
          },
          zone: {
            group: "delimitation",
            locales: {
              en: {
                friendlyName: "Sector's GPS zone",
                description: "The GPS delimitations of the sector of activity",
              },
              fr: {
                friendlyName: "Zone géographique d'activité",
                description: "Limites géographiques de la zone d'activité",
              },
            },
          },
          size: {
            locales: {
              en: {
                friendlyName: "Truck fleet size",
                description: "The number of trucks in the fleet",
              },
              fr: {
                friendlyName: "Taille de la flotte",
                description: "Le nombre de camions dans la flotte",
              },
            },
          },
        },
        metadataGroups: {
          delimitation: {
            locales: {
              en: {
                groupFriendlyName: "Delimitations",
                description: "The limits of the fleet's activity zone",
              },
              fr: {
                groupFriendlyName: "Limites géographiques",
                description: "Les limites de la zone d'activité de la flotte",
              },
            },
          },
        },
      },
    });

    const groupModel2 = await sdk.document.get(
      "device-manager",
      "models",
      "model-group-TruckFleet",
    );
    expect(groupModel2._source).toMatchObject({
      type: "group",
      engineGroup: "air_quality",
      group: {
        model: "TruckFleet",
        metadataMappings: {
          sector: { type: "keyword" },
          zone: { type: "geo_shape" },
          size: { type: "integer" },
        },
        metadataDetails: {
          sector: {
            group: "delimitation",
            locales: {
              en: {
                friendlyName: "Geographic sector name",
                description:
                  "The name of the geographic sector of activity of the fleet",
              },
              fr: {
                friendlyName: "Nom de la zone d'activité",
                description:
                  "Le nom de la  zone géographique d'activité de la zone",
              },
            },
          },
          zone: {
            group: "delimitation",
            locales: {
              en: {
                friendlyName: "Sector's GPS zone",
                description: "The GPS delimitations of the sector of activity",
              },
              fr: {
                friendlyName: "Zone géographique d'activité",
                description: "Limites géographiques de la zone d'activité",
              },
            },
          },
          size: {
            locales: {
              en: {
                friendlyName: "Truck fleet size",
                description: "The number of trucks in the fleet",
              },
              fr: {
                friendlyName: "Taille de la flotte",
                description: "Le nombre de camions dans la flotte",
              },
            },
          },
        },
        metadataGroups: {
          delimitation: {
            locales: {
              en: {
                groupFriendlyName: "Delimitations",
                description: "The limits of the fleet's activity zone",
              },
              fr: {
                groupFriendlyName: "Limites géographiques",
                description: "Les limites de la zone d'activité de la flotte",
              },
            },
          },
        },
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const tenantGroupMapping = await sdk.collection.getMapping(
      "engine-ayse",
      "assets-groups",
    );
    expect(tenantGroupMapping.properties).toMatchObject({
      metadata: {
        properties: {
          sector: { type: "keyword" },
          zone: { type: "geo_shape" },
          size: { type: "integer" },
        },
      },
    });
    const listGroups = await sdk.query<ApiModelListGroupsRequest>({
      controller: "device-manager/models",
      action: "listGroups",
      engineGroup: "air_quality",
    });
    expect(listGroups.result).toMatchObject({
      total: 2,
      models: [
        { _id: "model-group-Parking" },
        { _id: "model-group-TruckFleet" },
      ],
    });

    const getGroup = await sdk.query<ApiModelGetGroupRequest>({
      controller: "device-manager/models",
      action: "getGroup",
      model: "TruckFleet",
    });

    expect(getGroup.result).toMatchObject({
      _id: "model-group-TruckFleet",
      _source: { group: { model: "TruckFleet" } },
    });
  });

  it("Write and Search a group model", async () => {
    await sdk.query<ApiModelWriteGroupRequest>({
      controller: "device-manager/models",
      action: "writeGroup",
      body: {
        engineGroup: "air_quality",
        model: "TruckFleet",
        metadataMappings: {
          sector: { type: "keyword" },
          zone: { type: "geo_shape" },
          size: { type: "integer" },
        },
        metadataDetails: {
          sector: {
            group: "delimitation",
            locales: {
              en: {
                friendlyName: "Geographic sector name",
                description:
                  "The name of the geographic sector of activity of the fleet",
              },
              fr: {
                friendlyName: "Nom de la zone d'activité",
                description:
                  "Le nom de la  zone géographique d'activité de la zone",
              },
            },
          },
          zone: {
            group: "delimitation",
            locales: {
              en: {
                friendlyName: "Sector's GPS zone",
                description: "The GPS delimitations of the sector of activity",
              },
              fr: {
                friendlyName: "Zone géographique d'activité",
                description: "Limites géographiques de la zone d'activité",
              },
            },
          },
          size: {
            locales: {
              en: {
                friendlyName: "Truck fleet size",
                description: "The number of trucks in the fleet",
              },
              fr: {
                friendlyName: "Taille de la flotte",
                description: "Le nombre de camions dans la flotte",
              },
            },
          },
        },
        metadataGroups: {
          delimitation: {
            locales: {
              en: {
                groupFriendlyName: "Delimitations",
                description: "The limits of the fleet's activity zone",
              },
              fr: {
                groupFriendlyName: "Limites géographiques",
                description: "Les limites de la zone d'activité de la flotte",
              },
            },
          },
        },
      },
    });

    await sdk.query<ApiModelWriteGroupRequest>({
      controller: "device-manager/models",
      action: "writeGroup",
      body: {
        engineGroup: "air_quality",
        model: "Building",
        metadataMappings: {
          location: { type: "geo_point" },
          floors: { type: "integer" },
        },
      },
    });

    await sdk.collection.refresh("device-manager", "models");

    const searchGroups = await sdk.query<ApiModelSearchGroupsRequest>({
      controller: "device-manager/models",
      action: "searchGroups",
      engineGroup: "air_quality",
      body: {
        query: {
          match: {
            "group.model": "TruckFleet",
          },
        },
      },
    });

    expect(searchGroups.result).toMatchObject({
      total: 1,
      hits: [{ _id: "model-group-TruckFleet" }],
    });
  });

  it("Error if the model name is not PascalCase", async () => {
    const badModelName = sdk.query<ApiModelWriteGroupRequest>({
      controller: "device-manager/models",
      action: "writeGroup",
      body: {
        engineGroup: "commons",
        model: "flatgroupnape",
        metadataMappings: { size: { type: "integer" } },
        defaultValues: { size: 12 },
      },
    });

    await expect(badModelName).rejects.toMatchObject({
      message: 'Group model "flatgroupnape" must be PascalCase.',
    });
  });

  it("Should throw on mappings conflict", async () => {
    await sdk.query<ApiModelWriteGroupRequest>({
      controller: "device-manager/models",
      action: "writeGroup",
      body: {
        engineGroup: "air_quality",
        model: "TruckFleet",
        metadataMappings: {
          size: { type: "integer" },
        },
        metadataDetails: {
          size: {
            locales: {
              en: {
                friendlyName: "Truck fleet size",
                description: "The number of trucks in the fleet",
              },
              fr: {
                friendlyName: "Taille de la flotte",
                description: "Le nombre de camions dans la flotte",
              },
            },
          },
        },
      },
    });
    const badMappingRequest = sdk.query<ApiModelWriteGroupRequest>({
      controller: "device-manager/models",
      action: "writeGroup",
      body: {
        engineGroup: "air_quality",
        model: "BadModel",
        metadataMappings: {
          size: { type: "keyword" },
        },
        metadataDetails: {
          size: {
            locales: {
              en: {
                friendlyName: "Truck fleet size",
                description:
                  "The word representing the size of trucks in the fleet",
              },
              fr: {
                friendlyName: "Taille de la flotte",
                description: "Le nombre en lettre de camions dans la flotte",
              },
            },
          },
        },
      },
    });
    await expect(badMappingRequest).rejects.toThrow(
      "New group mappings are causing conflicts",
    );
  });
});
