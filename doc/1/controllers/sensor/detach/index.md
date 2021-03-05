---
code: true
type: page
title: detach
description: Detach a sensor from a tenant
---

# detach

Detach a sensor from a tenant.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/sensors/_:id/_detach[?refresh=wait_for]
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/sensor",
  "action": "detach",
  "_id": "<sensorId>"
}
```

---

## Arguments

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the documents are indexed

---

## Response

```js
{
  "status": 200,
  "error": null,
  "index": "<index>",
  "controller": "device-manager/sensor",
  "action": "detach",
  "requestId": "<unique request identifier>",
  "result": {}
}
```
