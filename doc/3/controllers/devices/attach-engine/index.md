---
code: true
type: page
title: attachEngine
description: Attach a device to an engine
---

# attachEngine

Attach a device to an engine.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/devices/:_id/_attach
Method: PUT
```

### Other protocols

```js
{
  "controller": "device-manager/devices",
  "action": "attachEngine",
  "engineId": "<engineId>",
  "_id": "<deviceId>",
}
```

---

## Arguments

- `engineId`: Engine ID
- `_id`: Device ID

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/devices",
  "action": "attachEngine",
  "requestId": "<unique request identifier>",
}
```
