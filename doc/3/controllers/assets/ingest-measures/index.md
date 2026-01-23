---
code: true
type: page
title: ingestMeasures
description: Kuzzle IoT Platform - Device Manager - Assets Controller
---

# ingestMeasures

<SinceBadge version="2.5.0" />
Ingest measures from a data source into an asset.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:assetId/_mIngestMeasure
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "mIngestMeasure",
  "assetId": "<assetId>",
  "engineId": "<engineId>",
  "body": {
    "dataSource": {
      "id": "<id>",
      // optional:
      "metadata": {
        // ...
      }
    },
    "measurements": [
      {
        "slotName": "<measureName>",
        "measuredAt": "<measuredAt>",
        "values": {
          "<valueName>": "<value>",
          // ...        
        }
      }
      // ...
    ]
  },
}
```

---

## Arguments

- `engineId`: target engine id
- `assetId`: target asset id

## Body properties

- `dataSource`: the measures source
- `measurements`: the list of measurements to ingest

# Datasource properties

- `id`: the measure source unique identifier
- `metadata`: (optional) additional metadata for the source

# Measurement properties

- `slotName`: target measure slot name
- `measuredAt`: the timestamp of when the measure was collected
- `values`: the measure values

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "mIngestMeasure",
  "requestId": "<unique request identifier>",
  "result": null,
}
```

## Errors

Ingesting measures with incorrect values will throw a [ MeasureValidationError ](../../../errors/measure-validation/index.md) with the HTTP code **400**.