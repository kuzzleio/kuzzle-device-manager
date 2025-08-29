---
code: false
type: page
title: Models
description: Assets, Measure and Devices Models
---

# Models

In order to model a use case, it is possible to define models of sensors and assets that will be used when creating digital twins.

Each sensor or asset is an instance of a previously defined model.

Models can be defined upstream through the backend framework but also dynamically using the API.

## Sensor Model

A sensor model contains the following information:

- `model`: model name
- `measures`: received measurements
- `decoder`: (optional) instance of a [Decoder] to normalize the data
- `metadataMappings`: (optional) metadata mappings (See [Collection Mappings](https://docs.kuzzle.io/core/3/guides/main-concepts/data-storage/#collection-mappings))
- `defaultMetadata`: (optional) default metadata values
- `metadataDetails`: (optional) Translations, metadata group and editor hint.
  - Translations: you can use it to keep consistency on translations between your apps.
  - Group: metadata can be displayed grouped, you need to define `metadataGroups` to use it.
  - Editor hint: it unlock functionalities depending on the metadata type you define.
- `metadataGroups`: (optional) Map of group names to their translations. You can use it to group metadata.

It is possible to create new models on the Kuzzle IoT Platform using either:

- the API through the action `device-manager/models:writeDevice`
- the framework with the method `deviceManager.models.registerDevice`

**Example: declaration of a model via API**

```js
import {
  ApiModelWriteDeviceRequest,
  ApiModelWriteDeviceResult,
} from "kuzzle-device-manager-types";

(await sdk.query) < ApiModelWriteDeviceRequest,
  ApiModelWriteDeviceResult >
    {
      controller: "device-manager/models",
      action: "writeDevice",
      body: {
        model: "Enginko",
        measures: [
          { name: "temperatureInternal", type: "temperature" },
          { name: "temperatureExternal", type: "temperature" },
        ],
      },
    };
```

The API also allows to:

- list available devices models `device-manager/models:listDevices`
- get a device model `device-manager/models:getDevices`
- search device models `device-manager/models:searchDevices`
- delete a device model `device-manager/models:deleteDevice`
## Measure Model

A measure model contains the following information:

- `model`: model name
- `measure`: type of the measure
- `valuesMappings`: measurements mappings (See [Collection Mappings](https://docs.kuzzle.io/core/3/guides/main-concepts/data-storage/#collection-mappings))
- `valuesDetails`: (optional) Metadata and translations of measurements. You can use it to keep consistency on translations between your apps
- `locales`: (optional) Translation for the measure model

It is possible to create new models on the Kuzzle IoT Platform using either:

- the API through the action `device-manager/models:writeMeasure`
- the framework with the method `deviceManager.models.registerMeasure`

**Example: declaration of a model via API**

```typescript
await sdk.query({
  controller: "device-manager/models",
  action: "writeMeasure",
  body: {
    type: "light",
    valuesMappings: {
      light: { type: "integer" },
    },
    valuesDetails: {
      light: {
        en: {
          friendlyName: "Light intensity",
          unit: "lux",
        },
        fr: {
          friendlyName: "Intensité lumineuse",
          unit: "lux",
        },
      },
    },
    locales: {
      en: {
        modelFriendlyName: "Light measurement",
        modelDescription: "Light measurement",
      },
      fr: {
        modelFriendlyName: "Mesure de lumière",
        modelDescription: "Mesure de lumière",
      },
    }
  },
});
```

The API also allows to:

- list registered measures `device-manager/models:listMeasures`
- get a measure model `device-manager/models:getMeasure`
- search measure models `device-manager/models:searchMeasures`
- delete a measure model `device-manager/models:deleteMeasure`
## Asset Model

Unlike sensors and metrics which are available for all engine groups, asset models are specific to a particular engine group.

An asset model contains the following information:

- `model`: model name
- `engineGroup`: engine group to which the model belongs.
- `measures`: received measurements
- `metadataMappings`: (optional) metadata mappings (See [Collection Mappings](https://docs.kuzzle.io/core/3/guides/main-concepts/data-storage/#collection-mappings))
- `defaultMetadata`: (optional) default metadata values-
- `metadataDetails`: (optional) Translations, metadata group and editor hint.
  - Translations: you can use it to keep consistency on translations between your apps.
  - Group: metadata can be displayed grouped, you need to define `metadataGroups` to use it.
  - Editor hint: it unlock functionalities depending on the metadata type you define.
- `metadataGroups`: (optional) Map of group names to their translations. You can use it to group metadata.
- `tooltipModels`: (optional) Tooltip model list, each containing labels and tooltip content to be shown. You can use it to create templates that displays relevant information in dashboards
- `locales`: (optional) Translation for asset model

It is possible to create new models on the Kuzzle IoT Platform using either:

- the API through the `device-manager/models:writeAsset` action
- the framework with the method `deviceManager/models.registerAsset`

**Example: declaration of a model via API**

```js
import {
  ApiModelWriteAssetRequest,
  ApiModelWriteAssetResult,
} from "kuzzle-device-manager-types";

(await sdk.query) < ApiModelWriteAssetRequest,
  ApiModelWriteAssetResult >
    {
      controller: "device-manager/models",
      action: "writeAsset",
      engineGroup: "asset_tracking",
      body: {
        model: "Container",
        measures: [
          { name: "temperatureInternal", type: "temperature" },
          { name: "temperatureExternal", type: "temperature" },
        ],
        locales: {
          en: {
            friendlyName: "Container translated by model",
            description: "Containerized container",
          },
          fr: {
            friendlyName: "Conteneur traduit par modèle",
            description: "Conteneur conteneurisé",
          },
        }
      },
    };
```

**INFO: If the locales has changed, use [updateModelLocales](../../controllers/assets/updateModelLocales/index.md) to update all assets manually and make the search on assets up to date**

The API also allows to:

- list available models `device-manager/models:listAssets`
- get a model `device-manager/models:getAssets`
- search asset models `device-manager/models:searchAssets`
- delete a asset model `device-manager/models:deleteAsset`

## Group Model

A group model defines the structure and metadata for groups of devices or assets. Group models allow you to organize devices and assets into logical collections, apply permissions, and manage group-specific metadata.

A group model contains the following information:

- `model`: Group model name.
- `affinity`: Specifies the types and models of elements accepted in the group.
  - `type`: Array of accepted element types, possible values are `"assets"` and/or `"devices"`.
  - `models`: Object specifying which models are accepted for each type.  
    - `assets`: List of asset model names accepted in the group.
    - `devices`: List of device model names accepted in the group.
  - `strict`: Boolean indicating whether the affinities are a strict restriction (`true`) or just a suggestion (`false`). If `strict` is `true`, only the specified types and models can be added to the group.
- `metadataMappings`: (optional) Metadata mappings for group-specific information (see [Collection Mappings](https://docs.kuzzle.io/core/3/guides/main-concepts/data-storage/#collection-mappings)).
- `defaultMetadata`: (optional) Default metadata values for the group.
- `metadataDetails`: (optional) Translations, metadata group, and editor hints for group metadata.
  - **Translations:** Ensures consistency of metadata translations across applications.
  - **Group:** Allows metadata to be displayed in groups; define `metadataGroups` to use this feature.
  - **Editor hint:** Unlocks functionalities depending on the metadata type you define.
- `metadataGroups`: (optional) Map of group names to their translations, used to group metadata fields.
- `tooltipModels`: (optional) Tooltip model list, each containing labels and tooltip content to be shown. You can use it to create templates that display relevant information in dashboards.

You can create new group models on the Kuzzle IoT Platform using either:

- the API through the action `device-manager/models:writeGroup`
- the framework with the method `deviceManager.models.registerGroup`

**Example: declaration of a group model via API**

```typescript
await sdk.query({
  controller: "device-manager/models",
  action: "writeGroup",
  body: {
    model: "ParkingGroup",
    affinity: {
      type: ["assets", "devices"],
      models: {
        assets: ["ParkingSpot", "ParkingBarrier"],
        devices: ["ParkingSensor"]
      },
      strict: true
    },
    metadataMappings: {
      location: { type: "geo_point" }
    },
    defaultMetadata: {
      location: {
        lat: 41.12,
        lon: -71.34
      }
    },
    metadataDetails: {
      location: {
        group: "geolocation",
        locales: {
          en: {
            friendlyName: "Parking location",
            description: "The coordinates of the parking area"
          },
          fr: {
            friendlyName: "Localisation du parking",
            description: "Les coordonnées GPS du parking"
          }
        }
      }
    },
    metadataGroups: {
      geolocation: {
        locales: {
          en: {
            groupFriendlyName: "Parking geolocation",
            description: "The parking geolocation"
          },
          fr: {
            groupFriendlyName: "Localisation du parking",
            description: "La localisation du parking"
          }
        }
      }
    },
    tooltipModels: {
      defaultTooltipKey: {
        tooltipLabel: "Default Tooltip Model",
        content: [
          {
            category: "metadata",
            label: {
              locales: {
                en: {
                  friendlyName: "Parking location",
                  description: ""
                },
                fr: {
                  friendlyName: "Localisation du parking",
                  description: ""
                }
              }
            },
            metadataPath: "location"
          }
        ]
      }
    }
  }
});
```

The API also allows you to:

- list available group models `device-manager/models:listGroups`
- get a group model `device-manager/models:getGroup`
- search group models `device-manager/models:searchGroups`
- delete a group model `device-manager/models:deleteGroup`