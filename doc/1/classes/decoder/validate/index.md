---
code: true
type: page
title: validate
description: Decoder abstract class validate() method
---

# validate

Validate the payload format before processing.

This method must throw an error if the payload is not valid.

By default this method always returns `true`.
 
```ts
validate (payload: JSONObject, request: KuzzleRequest): Promise<boolean> | never
```

<br/>

| Arguments | Type                     | Description                                 |
|-----------|--------------------------|---------------------------------------------|
| `payload` | <pre>JSONObject</pre>    | Raw payload received in the API action body |
| `request` | <pre>KuzzleRequest</pre> | Original request                            |

## Returns

Returns a promise resolving to `true` if the payload is valid.

## Usage

Considering the following payload:

```js
{
  deviceEUI: '12345',
  register55: 23.3,
  batteryLevel: 0.8,
}
```

The following `validate` method could be implemented:

```js
import { JSONObject, KuzzleRequest, BadRequestError } from 'kuzzle';
import { Decoder } from 'kuzzle-plugin-device-manager';

class KarakoyDecoder extends Decoder {
  // [...]
  async validate (payload: JSONObject, request: KuzzleRequest): Promise<true> | never {
    if (typeof payload.deviceEUI !== 'string') {
      throw new BadRequestError('Missing "deviceEUI" property');
    }

    return true;
  }
}
```