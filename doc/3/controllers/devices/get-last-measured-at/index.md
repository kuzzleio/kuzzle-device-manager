---
code: true
type: page
title: getLastMeasuredAt
description: Retrieves the last measure date of a device
---

# getLastMeasuredAt

Retrieves the last measure date of a device.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/devices/:_id/lastMeasuredAt
Method: GET or POST
```

### Other protocols

```js
{
  "controller": "device-manager/devices",
  "action": "getLastMeasuredAt",
  "engineId": "<engineId>",
  "_id": "<deviceId>"
}
```

---

## Arguments

- `engineId`: engine id
- `_id`: device id

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/devices",
  "action": "getLastMeasuredAt",
  "requestId": "<unique request identifier>",
  "result": {
    "lastMeasuredAt": 42
  }
}
```
