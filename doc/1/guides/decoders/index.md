---
code: false
type: page
title: Decoder
description: Use decoders to receive process various payload 
order: 200
---

# Decoders

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

## Hooks 

It is possible to intervene during the processing of a payload with hooks:

  - `validate`: Validate the payload format before processing
  - `beforeRegister`: Enrichment hook executed before registering a sensor
  - `afterRegister`: Hook executed after registering a sensor
  - `beforeUpdate`: Enrichment hook executed before updating a sensor
  - `afterUpdate`: Hook executed after updating a sensor

See also: [Decoder abstract class](/kuzzle-iot-platform/device-manager/1/classes/decoder).
