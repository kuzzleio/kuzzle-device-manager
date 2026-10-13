---
code: true
type: page
title: attachEngine
description: Attach a device to a tenant engine
---

# attachEngine

Attach a device to a tenant engine.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/devices/:_id/_attach
Method: PUT
```

### Other protocols

```js
{
  "controller": "device-manager/devices",
  "action": "attachEngine",
  "index": "<index>",
  "_id": "<deviceId>",
}
```

---

## Arguments

- `index`: Engine ID
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
