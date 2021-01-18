---
code: true
type: page
title: unlink
description: Unlink a sensor from an asset
---

# unlink

Unlink a sensor from it's asset.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/sensors/_:id/_unlink[?refresh=wait_for]
Method: DELETE
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/sensor",
  "action": "unlink",
  "_id": "<sensorId>"
}
```

---

## Arguments

- `index`: Tenant index name

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
  "action": "unlink",
  "requestId": "<unique request identifier>",
  "result": {}
}
```
