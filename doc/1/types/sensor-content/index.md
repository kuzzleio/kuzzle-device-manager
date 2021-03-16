---
code: false
type: page
title: DeviceContent
description: DeviceContent type definition
---

# DeviceContent

The `DeviceContent` type represents the `_source` property of a device document.

```js
export type DeviceContent = {
  reference: string;
  model: string;
  measures: DeviceMeasures;
  metadata?: JSONObject;
  qos?: JSONObject;
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
