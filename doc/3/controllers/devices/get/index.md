---
code: true
type: page
title: get
description: Gets an device
---

# get

Gets a device.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/devices/:_id
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/devices",
  "action": "get",
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
  "action": "get",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<deviceId>",
    "_source": {
      // Device content
    },
  }
}
```
