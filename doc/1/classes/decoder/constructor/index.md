---
code: false
type: page
title: Constructor
description: Decoder abstract class constructor
---

# Decoder

Custom decoders must inherit the provided abstract `Decoder` class.

The super constructor must be called with the sensor model name.

---

## Constructor

```ts
Decoder()
```

### Example

```ts
import { Decoder } from 'kuzzle-plugin-device-manager';

class KarakoyDecoder extends Decoder {
  constructor () {
    super('Karakoy');
  }

  // This method must be implemented
  async decode (payload: JSONObject, request: KuzzleRequest): Promise<SensorContent> {
    // ...custom sensor decoding function
  }
}
```
