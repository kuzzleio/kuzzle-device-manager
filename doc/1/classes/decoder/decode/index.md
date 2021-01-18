---
code: true
type: page
title: decode
description: Decoder abstract class abstract decode() method
---

# decode

This method must be implemented in order to decode the payload.

It has to return a promise resolving to a [SensorContent](/kuzzle-iot-platform/device-manager/1/types/sensor-content) with the following informations:
  - `reference`: sensor identifier
  - `model`: sensor model
  - `measures`: mesures received in the payload
  - `qos`: additional qos (optional)

```ts
abstract decode (payload: JSONObject, request: KuzzleRequest): Promise<SensorContent>
```

<br/>

| Arguments | Type                     | Description                                 |
|-----------|--------------------------|---------------------------------------------|
| `payload` | <pre>JSONObject</pre>    | Raw payload received in the API action body |
| `request` | <pre>KuzzleRequest</pre> | Original request                            |

## Returns

Returns a promise resolving to a `SensorContent`.

## Usage

Considering the following payload:

```js
{
  deviceEUI: '12345',
  register55: 23.3,
  batteryLevel: 0.8,
}
```

The following `decode` method could be implemented:

```js
import { JSONObject, KuzzleRequest } from 'kuzzle';
import { Decoder, SensorContent } from 'kuzzle-plugin-device-manager';

class KarakoyDecoder extends Decoder {
  // [...]
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
      qos: {
        battery: payload.batteryLevel * 100
      }
    };

    return sensorContent;
  }
}
```