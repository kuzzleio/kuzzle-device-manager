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
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:_id/ingestMeasures/:slotName
Method: POST
```

This endpoint is exclusive to HTTP as it's only a simplified version of [ingestMeasures](./index.md), allowing ingestion of a single measure.

---

## Arguments

- `engineId`: target engine id
- `_id`: target asset id
- `slotName`: target measure slot name
- `engineGroup` (optional): target engine group

## Body properties

- `dataSourceId`: measure source identifier
- `dataSourceMetadata`: (optional) additional metadata for the source
- `measuredAt`: the timestamp of when the measure was collected
- `values`: measure values

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "ingestMeasure",
  "requestId": "<unique request identifier>",
  "result": null,
}
```

## Errors

Ingesting a measure with incorrect values will throw a [ MeasureValidationError ](../../../errors/measure-validation/index.md) with the HTTP code **400**.