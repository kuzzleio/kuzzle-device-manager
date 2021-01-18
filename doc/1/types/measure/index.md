---
code: false
type: page
title: Measure
description: Measure type definition
---

# Measure, SensorMeasures and AssetMeasures

The `Measure` type represents a sensor measure.

The `SensorMeasures` type represents measures stored inside a sensor document.

The `AssetMeasures` type represents the measures + sensor information of a sensor stored inside an asset document.

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

export type SensorMeasures = {
  [measureType: string]: Measure;
}

export type AssetMeasures = {
  [measureType: string]: {
    // Sensors info
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
