---
code: false
type: page
title: Measure
description: Measure type definition
---

# Measure, DeviceMeasures and AssetMeasures

The `Measure` type represents a single device measure.

The `DeviceMeasures` type represents measures stored inside a device document.

The `AssetMeasures` type represents the measures + device information of a device stored inside an asset document.

```js
export type Measure = {
  updatedAt: number;
  payloadUuid: string;

  value?: number;

  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number;
}

export type DeviceMeasures = {
  [measureType: string]: Measure;
}

export type AssetMeasures = {
  [measureType: string]: {
    // Devices info
    id: string;
    model: string;
    reference: string;
    qos: JSONObject;

    // Measure common info
    updatedAt: number;
    payloadUuid: string;

    value?: number;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    accuracy?: number;
  }
}
```
