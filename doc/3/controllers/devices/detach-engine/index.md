---
code: true
type: page
title: detachEngine
description: Detach a device from an engine
---

# detachEngine

Detach a device from an engine.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/devices/:_id/_detach
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/devices",
  "action": "detachEngine",
  "_id": "<deviceId>",
}
```

---

## Arguments

- `_id`: Device ID

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/devices",
  "action": "detachEngine",
  "requestId": "<unique request identifier>",
}
```
