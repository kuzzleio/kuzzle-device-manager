---
code: true
type: page
title: unassign
description: Unassign a sensor from a tenant
---

# unassign

Unassign a sensor from a tenant.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/sensors/_:id/_unassign[?refresh=wait_for]
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/sensor",
  "action": "unassign",
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
  "action": "unassign",
  "requestId": "<unique request identifier>",
  "result": {}
}
```
