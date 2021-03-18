---
code: true
type: page
title: decode
description: Decoder abstract class abstract decode() method
---

# decode

This method must be implemented in order to decode the payload.

It has to return a promise resolving to a [DeviceContent](/kuzzle-iot-platform/device-manager/1/types/device-content) with the following information:
  - `reference`: device identifier
  - `measures`: measures received in the payload
  - `qos`: additional information about device state like battery, etc. (optional)

```ts
abstract decode (payload: JSONObject, request: KuzzleRequest): Promise<DeviceContent>
```

<br/>

| Arguments | Type                     | Description                                 |
|-----------|--------------------------|---------------------------------------------|
| `payload` | <pre>JSONObject</pre>    | Raw payload received in the API action body |
| `request` | <pre>KuzzleRequest</pre> | API request of origin                            |

## Returns

Returns a promise resolving to a `DeviceContent`.

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
import { Decoder, DeviceContent } from 'kuzzle-plugin-device-manager';

class KarakoyDecoder extends Decoder {
  // [...]
  async decode (payload: JSONObject, request: KuzzleRequest): Promise<DeviceContent> {
    const deviceContent: DeviceContent = {
      reference: payload.deviceEUI,
      measures: {
        temperature: {
          updatedAt: Date.now(),
          value: payload.register55,
        }
      },
      qos: {
        battery: payload.batteryLevel * 100
      }
    };

    return deviceContent;
  }
}
```
