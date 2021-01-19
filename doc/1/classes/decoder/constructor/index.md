---
code: false
type: page
title: Constructor
description: Decoder abstract class constructor
---

# Decoder

The `Decoder` class must be implemented by a child class.

The super constructor must be called with the sensor model.

---

## Constructor

```ts
Decoder()
```

<br/>

| Arguments     | Type              | Description  |
|---------------|-------------------|--------------|
| `sensorModel` | <pre>string</pre> | Sensor model |

### Example

```ts
import { Decoder } from 'kuzzle-plugin-device-manager';

class KarakoyDecoder extends Decoder {
  constructor () {
    super('Karakoy');
  }

  // [...] "decode" method must be implemented
}
```