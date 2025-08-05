---
code: true
type: page
title: delete
description: Deletes a device
---

# delete

Deletes a device.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/devices/:_id
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/devices",
  "action": "delete",
  "engineId": "<engineId>",
  "_id": "<deviceId>"
}
```

---

## Arguments

- `engineId`: engine id
- `_id`: device id

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/devices",
  "action": "delete",
  "requestId": "<unique request identifier>",
  "result": null
}
```
