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

## Metadata Referential

The metadata referential holds, in a single document, the metadata shared by the models of an application: their mappings, default translations, editor hint, default value and icon.

The mappings of every referential metadata are merged into the assets, devices and groups collections of every engine, used by a model or not. Asset, device and group models then use a metadata of the referential with `{ "referential": true }` in their `metadataMappings`, instead of redefining its mappings. This prevents models registered by different parts of an application from defining the same metadata with conflicting mappings.

A referential entry contains the following information:

- `mappings`: metadata mappings, either `{ type: "<type>" }` or `{ properties: { ... } }` (See [Collection Mappings](https://docs.kuzzle.io/core/3/guides/main-concepts/data-storage/#collection-mappings))
- `locales`: default translations of the metadata
- `editorHint`: (optional) default editor hint
- `defaultValue`: (optional) default value
- `icon`: (optional) icon representing the metadata. Free-form string, e.g. a FontAwesome icon name, a URL to a PNG/SVG image, or inline SVG markup

When a model is written, the `{ "referential": true }` marker is kept in its `metadataMappings`, and the referential values are copied into the model:

- `metadataDetails`: the referential `editorHint` and `icon` when the model does not define them, and the referential `locales` merged per locale under the model ones. A locale can override only its `friendlyName` or its `description`; a locale missing from the referential defaults to the metadata name and an empty description. The `group` is defined by the model
- `defaultMetadata`: the referential `defaultValue` when the model does not define one

The get, list and search actions on asset, device and group models return the models resolved: the markers are replaced by the referential mappings, and the details and default values are merged over the current referential values. With `rawModel: true` they return the stored documents as is: sending one back leaves the model unchanged. Sending back a resolved model turns its referential metadata into inline metadata, so edit a model from its raw document.

Rules:

- using an unknown metadata is rejected (400)
- a model can still define metadata inline with `metadataMappings` (legacy behaviour), but an inline metadata with the name of a referential entry and different mappings is rejected (409)
- the mappings of a referential entry cannot be modified (400), they are already merged into the engines collections. Its `locales`, `editorHint`, `defaultValue` and `icon` can be updated, they apply to the models written afterwards
- a new entry is rejected (409) if it conflicts with an inline metadata of the same name of a model, or with the actual mappings of an engine collection
- a model is rejected (409) if its metadata conflict with the other models or with the actual mappings of its engines collections. Mappings of deleted models or removed metadata stay in Elasticsearch, so they are also checked
- if Elasticsearch rejects the mappings of a new entry or of a model when the engines collections are updated (e.g. an unknown type), the request fails and the previous referential or model is restored, so the next updates are not affected
- writes of the referential and of asset, device and group models are serialized, so their conflicts checks always see each other
- an entry used by a model cannot be deleted. The mappings of a deleted entry stay in the engines collections
- with the [`models.metadata.referentialOnly`](../configuration/index.md) option, the models written through the API can only add metadata of the referential, new inline metadata are rejected (400)
- an entry registered from code is flagged `managed: true` and cannot be modified or deleted through the API (400). An entry that is no longer registered from code loses the flag at the next startup. Registering from code an entry whose mappings differ from the stored ones, or a new entry conflicting with the existing mappings, prevents the application from starting

It is possible to fill the referential using either:

- the framework with the method `deviceManager.models.registerMetadata`, the metadata are written at startup and overwrite the details of the ones with the same name. Registering the same name again is allowed only with an identical definition, so several modules can share a metadata
- the API through the `device-manager/models:writeMetadata` action

**Example: declaration of a metadata and a model using it**

```typescript
deviceManager.models.registerMetadata("operatingStatus", {
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
  icon: "power-off",
});

deviceManager.models.registerAsset(["commons"], "Pole", {
  measures: [{ name: "position", type: "position" }],
  metadataMappings: {
    // Inline metadata, not in the referential
    height: { type: "integer" },
    operatingStatus: { referential: true },
  },
  metadataDetails: {
    operatingStatus: { icon: "plug", locales: {} },
  },
  defaultMetadata: {
    operatingStatus: "inactive",
  },
});
```

The API also allows to:

- get the referential `device-manager/models:getMetadataReferential`
- delete an unused metadata `device-manager/models:deleteMetadata`

## Sensor Model

A sensor model contains the following information:

- `model`: model name
- `measures`: received measurements
- `icon`: (optional) Icon representing the device model. Free-form string, e.g. a FontAwesome icon name, a URL to a PNG/SVG image, or inline SVG markup — the format is up to the application. Not indexed for search.
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
- `icon`: (optional) Icon representing the measure model. Free-form string, e.g. a FontAwesome icon name, a URL to a PNG/SVG image, or inline SVG markup — the format is up to the application. Not indexed for search.
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

Unlike sensors and metrics which are available for all tenant classes, asset models are specific to a particular tenant class.

An asset model contains the following information:

- `model`: model name
- `tenantClasses`: tenant classes to which the model belongs (`["commons"]` for every class).
- `measures`: received measurements
- `icon`: (optional) Icon representing the asset model. Free-form string, e.g. a FontAwesome icon name, a URL to a PNG/SVG image, or inline SVG markup — the format is up to the application. Not indexed for search.
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
      body: {
        model: "Container",
        tenantClasses: ["asset_tracking"],
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
- `icon`: (optional) Icon representing the group model. Free-form string, e.g. a FontAwesome icon name, a URL to a PNG/SVG image, or inline SVG markup — the format is up to the application. Not indexed for search.
- `metadataMappings`: (optional) Metadata mappings for group-specific information (see [Collection Mappings](https://docs.kuzzle.io/core/3/guides/main-concepts/data-storage/#collection-mappings)).
- `defaultMetadata`: (optional) Default metadata values for the group.
- `metadataDetails`: (optional) Translations, metadata group, and editor hints for group metadata.
  - **Translations:** Ensures consistency of metadata translations across applications.
  - **Group:** Allows metadata to be displayed in groups; define `metadataGroups` to use this feature.
  - **Editor hint:** Unlocks functionalities depending on the metadata type you define.
- `metadataGroups`: (optional) Map of group names to their translations, used to group metadata fields.
- `tooltipModels`: (optional) Tooltip model list, each containing labels and tooltip content to be shown. You can use it to create templates that display relevant information in dashboards.
- `locales`: (optional) Translation for group model

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
    },
    locales: {
      en: {
        friendlyName: "Parking group translated by model",
        description: "Group of parking assets and devices"
      },
      fr: {
        friendlyName: "Groupe de parking traduit par modèle",
        description: "Groupe d'actifs et d'appareils de parking"
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