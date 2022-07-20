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
  assetId?: string;
  engineId?: string;

  _kuzzle_info?: {
    author?: string,
    createdAt?: number,
    updater?: string | null,
    updatedAt?: number | null
  }
}
```

## Documents in collections

A device document can be found in the following collections:
- `device-manager`:`devices`
- `<attached-engine-index>`:`devices`
