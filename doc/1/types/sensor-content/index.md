---
code: false
type: page
title: SensorContent
description: SensorContent type definition
---

# SensorContent

The `SensorContent` type represents the `_source` property of a sensor document.

```js
export type SensorContent = {
  reference: string;
  model: string;
  measures: SensorMeasures;
  metadata: JSONObject;
  assetId?: string;
  tenantId?: string;

  _kuzzle_info?: {
    author?: string,
    createdAt?: number,
    updater?: string | null,
    updatedAt?: number | null
  }
}
```
