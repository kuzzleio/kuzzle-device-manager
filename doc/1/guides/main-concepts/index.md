---
code: false
type: page
title: Main Concepts
description: Learn about main concepts like sensors, assets, decoders and multi-tenancy
order: 100
---

# Main Concepts

This plugin allows you to manage the gathering of information from sensors and to link them to assets.

It allows to manage several different types of sensors via the registration of decoder classes of the associated payloads.

The plugin is designed to work with several tenants each having their own sensors and assets.

## Sensors

A sensor document represents the digital twin of a real sensor in the field.

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
    "battery": 86
  },
  "tenantId": null,
  "assetId": null
}
```

### Measures

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

// Declare a new "shock" measure 
deviceManager.mappings.sensors.measures = {
  shock: {
    properties: {
      updatedAt: { type: 'date' },
      payloadUuid: { type: 'keyword' },
      value: { type: 'float' },
    }
  }
};
```

### Assignation

Sensors can be assigned to tenant by using the [device-manager/sensor:assign](/kuzzle-iot-platform/device-manager/1/controllers/sensor/assign) API action.

When assigned, the sensor document is copied inside the `sensors` collection of the tenant index.

### Link to an asset

Sensors can be linked to an asset by using the [device-manager/sensor:link](/kuzzle-iot-platform/device-manager/1/controllers/sensor/link) API action.

When linked, the sensor measures are copied inside the asset document.

New measures received by the sensor will be propagated inside the asset document.

### Historization

When a sensor is associated to a tenant, its content is historized with each new measurement received within the `sensor-history` collection of the tenant's index.

### Metadata

It is possible to attach metadata to the sensors within the `metadata` property.

It is possible to define metadata mappings by declaring it at plugin initialization:

```js
import { DeviceManager } from 'kuzzle-plugin-device-manager';

const deviceManager = new DeviceManager();

// Declare a "battery" metadata of type "integer" 
deviceManager.mappings.sensors.metadata = {
  battery: { type: 'integer' }
};
```

## Decoders

Each sensor model can receive a different payload, it is then necessary to decode this payload in order to retrieve the necessary information and put it in the right place in the document of the associated sensor.

To do this, it is necessary to implement a decoder by implementing the `Decoder` class.

This class must at least implement the `decode` method in order to retrieve at the right place the payload data.

A decoder is linked to a sensor model. Its registration triggers the creation of a specific API action to receive payloads from this sensor model. Each payload will be decoded by the decoder provided.

**Example:** _Decoder for the sensor model "Karakoy"_

```js
// "Karakoy" sensor payload
{
  deviceEUI: '12345',
  register55: 23.3,
  batteryLevel: 0.8,
}
```

```js
import { JSONObject, KuzzleRequest } from 'kuzzle';
import { Decoder, SensorContent, DeviceManager } from 'kuzzle-plugin-device-manager';

const deviceManager = new DeviceManager();

class KarakoyDecoder extends Decoder {
  constructor () {
    super("Karakoy");
  }

  async decode (payload: JSONObject, request: KuzzleRequest): Promise<SensorContent> {
    const sensorContent: SensorContent = {
      reference: payload.deviceEUI,
      model: this.sensorModel,
      measures: {
        temperature: {
          updatedAt: Date.now(),
          payloadUuid: request.internalId,
          value: payload.register55,
        }
      },
      metadata: {
        battery: payload.batteryLevel * 100
      }
    };

    return sensorContent;
  }
}

// A new API action will be generated to handle the "Karakoy" sensor model payloads:
//  - controller: "device-manager/payload"
//  - action: "karakoy"
//  - url: POST "/_/device-manager/payload/karakoy"
deviceManager.registerDecoder(new KarakoyDecoder());
```

### Hooks 

It is possible to intervene during the processing of a payload with hooks:

  - `validate`: Validate the payload format before processing
  - `beforeRegister`: Enrichment hook executed before registering a sensor
  - `afterRegister`: Hook executed after registering a sensor
  - `beforeUpdate`: Enrichment hook executed before updating a sensor
  - `afterUpdate`: Hook executed after updating a sensor

See also: [Decoder abstract class](/kuzzle-iot-platform/device-manager/1/classes/decoder).

## Assets

An asset document represents the digital twin of a real asset in the field to which one or more sensors can be attached.

The document contains asset identification information, the latest measurements received by the associated sensors and metadata.

An asset is uniquely identified by the `model` + `reference` pair.

**Example:** _Asset document with a GPS measure_

```js
{
  "model": "<asset model designation>",
  "reference": "<asset model unique identifier>",
  "measures": {
    "position": {
      "id": "<associated sensor unique identifier>",
      "model": "<associated sensor model>",
      "reference": "<associated sensor reference>",
      "metadata": {
        // associated sensor metadata
      },
      "updatedAt": "<timestamp of the measure>",
      "payloadUuid": "<identifier of the received payload>",
      "latitude": 41.074688,
      "longitude": 28.9800192,
      "accuracy": 42,
      "altitude": 12
    }
  },
  "metadata": {
    "battery": 86
  },
  "tenantId": null,
  "assetId": null
}
```

## Multi Tenancy

The plugin is designed to work with several tenants, each with their own sensors and assets.

Each tenant has its own index with the required collections.

It is possible to manage its holders with the [device-manager/engine](/kuzzle-iot-platform/device-manager/1/controllers/engine) controller.

::: info
When used with the multi-tenant plugin, the collections needed by the device-manager are automatically created when creating a new tenant with the multi-tenant plugin.
:::

### Sensors

The list of available sensors is stored in the sensors collection of the administration index (device-manager).

When assigning the sensor to a tenant, the `tenantId` property is updated and the sensor is copied to the `sensors` collection of the tenant's index.