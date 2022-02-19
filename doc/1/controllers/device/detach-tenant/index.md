---
code: true
type: page
title: detachEngine
description: Detach a device from a tenant
---

# detachEngine

Detach a device from a tenant.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/devices/:_id/_detach[?refresh=wait_for]
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/device",
  "action": "detachEngine",
  "_id": "<deviceId>"
}
```

### Kourou

```bash
kourou device-manager/device:detachEngine --id <deviceId>
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
  "controller": "device-manager/device",
  "action": "detachEngine",
  "requestId": "<unique request identifier>",
  "result": {}
}
```
