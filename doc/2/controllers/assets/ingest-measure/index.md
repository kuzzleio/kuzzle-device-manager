---
code: true
type: page
title: ingestMeasure
description: Kuzzle IoT Platform - Device Manager - Assets Controller
---

# ingestMeasure

Ingest a single measure into an asset.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:assetId/measures/:slotName
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "measureIngest",
  "assetId": "<assetId>",
  "engineId": "<engineId>",
  "slotName": "<slotName>"
  "body": {
    "dataSourceId": "<dataSourceId>",
    "measuredAt": "<mesuredAt>",
    "values": {
      "<valueName>": "<value>",
      // ...
    }
    // optional:
    "metadata": {
      // ...
    }
  },

  // optional:
  "engineGroup": "<engine group>"
}
```

---

## Arguments

- `engineId`: target engine id
- `assetId`: target asset id
- `slotName`: target measure slot name
- `engineGroup` (optional): target engine group

## Body properties

- `dataSourceId`: measure source identifier
- `metadata`: (optional) additional metadata for the source
- `measuredAt`: the timestamp of when the measure was collected
- `values`: measure values

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "measureIngest",
  "requestId": "<unique request identifier>",
  "result": null,
}
```

## Errors

Ingesting a measure with incorrect values will throw a [ MeasureValidationError ](../../../errors/measure-validation/index.md) with the HTTP code **400**.