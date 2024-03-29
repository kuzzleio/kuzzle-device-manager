---
code: false
type: page
title: Constructor
description: Decoder abstract class constructor
---

# Decoder

Custom decoders must inherit the provided abstract `Decoder` class.

The super constructor must be called with the device model name.

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
    super("Karakoy", ["temperature"]);
  }

  // This method must be implemented
  async decode (payload: JSONObject, request: KuzzleRequest): Promise<DeviceContent> {
    // ...custom device decoding function
  }
}
```
