---
code: false
type: page
title: Assets
description: Asset document
order: 300
---

# Assets

An asset document represents the digital twin of a real asset in the field to which one or more sensors can be attached.

The document contains asset identification information, the latest measurements received by the associated sensors and metadata.

An asset is uniquely identified by the `model` + `reference` pair.

**Example:** _Asset document with a GPS measure_

```js
{
  "model": "<asset model designation>",
  "reference": "<asset model unique identifier>",
  "measures": {
    "position": {
      "id": "<associated sensor unique identifier>",
      "model": "<associated sensor model>",
      "reference": "<associated sensor reference>",
      "metadata": {
        // associated sensor metadata
      },
      "updatedAt": "<timestamp of the measure>",
      "payloadUuid": "<identifier of the received payload>",
      "latitude": 41.074688,
      "longitude": 28.9800192,
      "accuracy": 42,
      "altitude": 12
    }
  },
  "metadata": {
    "battery": 86
  },
  "tenantId": null,
  "assetId": null
}
```

## Copy measures from sensors

When a sensor is assigned to an asset, it will automatically propagate the new measurements it receives into the asset's `measures` property.

By default, for each measurement type the following information are copied in addition of the measure content:
 - `id`: sensor document unique identifier
 - `model`: sensor model
 - `reference`: sensor reference
 - `metadata`: sensor metadata

**Example:** _Content of asset document linked to a sensor with a temperature measure_
```js
{
  "reference": "XYZ-42-AZE",
  "model": "PERFO-GTX1",
  "metadata": {},

  "measures": {
    "temperature": {
      "id": "IneoGTO42-98765poiuyt",
      "model": "IneoGTO42",
      "reference": "98765poiuyt",
      "metadata": {
        "battery": 2.3
      },
      
      // Measure content
      "updatedAt": 1610561030361,
      "payloadUuid": "...",
      "value": 23.3,
    }
  },
}
```

It is possible to override the [Decoder.copyToAsset](/kuzzle-iot-platform/device-manager/1/classes/decoder/copy-to-asset) method to choose what to copy into the asset.