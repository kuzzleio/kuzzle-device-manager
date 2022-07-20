---
code: false
type: page
title: BaseAssetContent
description: BaseAssetContent type definition
---

# BaseAssetContent

The `BaseAssetContent` type represents the `_source` property of a BaseAsset document.

The `DeviceLink` type represents the link between the asset and a device. It also bind the `deviceMeasureName` to an `assetDeviceName`.

# TODO : How to organize?

```ts
export type BaseAssetContent = {
  type: string;
  model: string;
  reference: string;
  measures: MeasureContent[],
  metadata?: JSONObject,
  deviceLinks: DeviceLink[],

  _kuzzle_info?: {
    author?: string,
    createdAt?: number,
    updater?: string | null,
    updatedAt?: number | null
  }
}

export type DeviceLink = {
  deviceId: string;
  measureNamesLinks: MeasureNamesLink[];
}

export type DeviceLink = {
  assetMeasureName: string;
  deviceMeasureName: string;
}
```
