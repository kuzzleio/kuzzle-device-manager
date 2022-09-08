---
code: false
type: page
title: DecodedPayload
description: DecodedPayload type definition
---

# DecodedPayload

The `DecodedPayload` type represents a payload that has been decoded. The `key` of the `Record` is the `reference` of the `device`.

```ts
export type DecodedPayload = Record<
  string,           // Reference of the device
  Measurement[]     // Measurements topush to the device
>;
```
