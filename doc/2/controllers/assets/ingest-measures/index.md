---
code: true
type: page
title: ingestMeasures
description: Kuzzle IoT Platform - Device Manager - Assets Controller
---

# ingestMeasures

Ingest measures from a data source into an asset.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:assetId/_mMeasureIngest
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "_mMeasureIngest",
  "assetId": "<assetId>",
  "engineId": "<engineId>",
  "body": {
    "dataSource": {
      // ...
    },
    "measurements": [
      {
        "measureName": "<measureName>",
        "measuredAt": "<measuredAt>",
        "values": {
          "<valueName>": "<value>",
          // ...        
        }
      }
      // ...
    ]
  },

  // optional:
  "engineGroup": "<engine group>"
}
```

---

## Arguments

- `engineId`: target engine id
- `assetId`: target asset id
- `engineGroup`: (optional): target engine group

## Body properties

- `dataSource`: the measures data source
- `measurements`: list of measurements to ingest
---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "mMeasureIngest",
  "requestId": "<unique request identifier>",
  "result": null,
}
```

## Errors

Ingesting measures with incorrect values will throw a [ MeasureValidationError ](../../../errors/measure-validation/index.md) with the HTTP code **400**.