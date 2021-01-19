---
code: false
type: page
title: Sensors
description: Sensors document format and management
order: 100
---

# Sensors

An asset document represents the physical asset.

The document contains sensor identification information, the last measurement received and metadata.

A sensor is uniquely identified by the pair `model` + `reference`.

**Example:** _GPS sensor document_
```js
{
  "model": "<sensor model designation>",
  "reference": "<sensor model unique identifier>",
  "measures": {
    "position": {
      "updatedAt": "<timestamp of the measure>",
      "payloadUuid": "<identifier of the received payload>",
      "latitude": 41.074688,
      "longitude": 28.9800192,
      "accuracy": 42,
      "altitude": 12
    }
  },
  "metadata": {
    "groupe": "red-team"
  },
  "qos": {
    "battery": 86
  },
  "tenantId": null,
  "assetId": null
}
```

## Measures

A sensor can receive several measurements in the same payload.

Each measurement must be stored in the key corresponding to its type: `measures.<measureType>`.

The plugin provides the following measurement types:

  - `position`: store a GPS location
  - `temperature`: store a temperature

<details><summary>See associated mappings</summary>

```js
{
  // [...]
  measures: {
    properties: {
      temperature: {
        properties: {
          updatedAt: { type: 'date' },
          payloadUuid: { type: 'keyword' },
          value: { type: 'float' },
        }
      },
      position: {
        properties: {
          updatedAt: { type: 'date' },
          payloadUuid: { type: 'keyword' },

          latitude: { type: 'float' },
          longitude: { type: 'float' },
          altitude: { type: 'float' },
          accuracy: { type: 'integer' },
        }
      },
    }
  },
}
```

</details>

It is possible to define custom measurement types by declaring them when initializing the plugin:

```js
import { DeviceManager } from 'kuzzle-plugin-device-manager';

const deviceManager = new DeviceManager();

// Declare a new "humidity" measure 
deviceManager.mappings.sensors.measures = {
  humidity: {
    properties: {
      updatedAt: { type: 'date' },
      payloadUuid: { type: 'keyword' },
      value: { type: 'float' },
    }
  }
};
```

## Assign to a tenant

Sensors can be assigned to tenant by using the [device-manager/sensor:assign](/kuzzle-iot-platform/device-manager/1/controllers/sensor/assign) API action.

When assigned, the sensor document is copied inside the `sensors` collection of the tenant index.

## Link to an asset

Sensors can be linked to an asset by using the [device-manager/sensor:link](/kuzzle-iot-platform/device-manager/1/controllers/sensor/link) API action.

When linked, the sensor measures are copied inside the asset document.

New measures received by the sensor will be propagated inside the asset document.

## Metadata

It is possible to attach metadata to the sensors within the `metadata` property.

It is possible to define `metadata` property mappings by declaring it at plugin initialization:

```js
import { DeviceManager } from 'kuzzle-plugin-device-manager';

const deviceManager = new DeviceManager();

// Declare a "group" metadata of type "keyword" 
deviceManager.mappings.sensors.metadata = {
  group: { type: 'keyword' }
};
```

## QOS

Alongside measures, a sensor may send information about it state (e.g. battery, signal strenght, etc.)

Those information should stored in the `qos` property.

They will be copied alongside the measure when the sensor in linked to an asset.

It is possible to define `qos` property mappings by declaring it at plugin initialization:

```js
import { DeviceManager } from 'kuzzle-plugin-device-manager';

const deviceManager = new DeviceManager();

// Declare a "battery" metadata of type "integer" 
deviceManager.mappings.sensors.qos = {
  battery: { type: 'integer' }
};
```
