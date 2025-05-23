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
- `metadataMappings`: (optional) metadata mappings (See [Collection Mappings](https://docs.kuzzle.io/core/2/guides/main-concepts/data-storage/#collection-mappings))
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
        measurements: [
          { name: "temperatureInternal", type: "temperature" },
          { name: "temperatureExternal", type: "temperature" },
        ],
      },
    };
```

The API also allows to:

- list available models `device-manager/models:listDevices`
- get a model `device-manager/models:getDevices`

## Measure Model

A measure model contains the following information:

- `model`: model name
- `measure`: type of the measure
- `valuesMappings`: measurements mappings (See [Collection Mappings](https://docs.kuzzle.io/core/2/guides/main-concepts/data-storage/#collection-mappings))
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

## Asset Model

Unlike sensors and metrics which are available for all engine groups, asset models are specific to a particular engine group.

An asset model contains the following information:

- `model`: model name
- `engineGroup`: engine group to which the model belongs.
- `measures`: received measurements
- `metadataMappings`: (optional) metadata mappings (See [Collection Mappings](https://docs.kuzzle.io/core/2/guides/main-concepts/data-storage/#collection-mappings))
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
        measurements: [
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
