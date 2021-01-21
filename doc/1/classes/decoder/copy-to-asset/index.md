---
code: true
type: page
title: copyToAsset
description: Decoder abstract class copyToAsset() method
---

# copyToAsset

Build the `measures` property that will be persisted in the asset document.

By default this method will copy the measures with sensor and qos information.

```ts
copyToAsset (sensor: Sensor, request: KuzzleRequest): Promise<AssetMeasures>
```

<br/>

| Arguments | Type                     | Description      |
|-----------|--------------------------|------------------|
| `sensor`  | <pre>Sensor</pre>        | Sensor document  |
| `request` | <pre>KuzzleRequest</pre> | Original request |

## Returns

Returns a promise resolving to an `AssetMeasures`.

## Usage


```js
import { KuzzleRequest } from 'kuzzle';
import { Decoder, AssetMeasures } from 'kuzzle-plugin-device-manager';

class KarakoyDecoder extends Decoder {
  // [...]
  async copyToAsset (sensor: Sensor): Promise<AssetMeasures> {
    const measures = {};

    for (const [measureType, measure] of Object.entries(sensor._source.measures)) {
      measures[measureType] = {
        id: sensor._id,
        model: sensor._source.model,
        reference: sensor._source.reference,
        ...measure,
        qos: sensor._source.qos,
      };
    }

    return measures;
  }
}
```

::: info
This is the default code for the `copyToAsset` method.
:::
