---
code: true
type: page
title: unlink
description: Unlinks a device from an asset
---

# unlink

Unlinks a device from its asset.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/devices/:_id/_unlink[?refresh=wait_for]
Method: DELETE
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/device",
  "action": "unlink",
  "_id": "<deviceId>"
}
```

### Kourou

```bash
kourou device-manager/device:unlink <index> --id <deviceId>
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
  "controller": "device-manager/device",
  "action": "unlink",
  "requestId": "<unique request identifier>",
  "result": {}
}
```
