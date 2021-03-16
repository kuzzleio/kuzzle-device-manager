---
code: true
type: page
title: copyToAsset
description: Decoder abstract class copyToAsset() method
---

# copyToAsset

Build the `measures` property that will be persisted in the asset document.

By default this method will copy the measures with device and qos information.

```ts
copyToAsset (device: Device, request: KuzzleRequest): Promise<AssetMeasures>
```

<br/>

| Arguments | Type                     | Description      |
|-----------|--------------------------|------------------|
| `device`  | <pre>Device</pre>        | Device document  |
| `request` | <pre>KuzzleRequest</pre> | Original request |

## Returns

Returns a promise resolving to an `AssetMeasures`.

## Usage


```js
import { KuzzleRequest } from 'kuzzle';
import { Decoder, AssetMeasures } from 'kuzzle-plugin-device-manager';

class KarakoyDecoder extends Decoder {
  // [...]
  async copyToAsset (device: Device): Promise<AssetMeasures> {
    const measures = {};

    for (const [measureType, measure] of Object.entries(device._source.measures)) {
      measures[measureType] = {
        id: device._id,
        model: device._source.model,
        reference: device._source.reference,
        ...measure,
        qos: device._source.qos,
      };
    }

    return measures;
  }
}
```

::: info
This is the default code for the `copyToAsset` method.
:::
