---
code: true
type: page
title: getLastMeasuredAt
description: Retrieves the last measure date of an asset
---

# getLastMeasuredAt

Retrieves the last measure date of an asset.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:_id/lastMeasuredAt
Method: GET or POST
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "getLastMeasuredAt",
  "engineId": "<engineId>",
  "_id": "<assetId>"
}
```

---

## Arguments

- `engineId`: engine id
- `_id`: asset id

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "getLastMeasuredAt",
  "requestId": "<unique request identifier>",
  "result": {
    "lastMeasuredAt": 42
  }
}
```
