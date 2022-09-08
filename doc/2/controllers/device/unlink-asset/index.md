---
code: true
type: page
title: unlinkAsset
description: Unlink a device from an asset
---

# unlinkAsset

Unlink a device from its asset.

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
  "action": "unlinkAsset",
  "_id": "<deviceId>"
}
```

### Kourou

```bash
kourou device-manager/device:unlinkAsset <index> --id <deviceId>
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
  "action": "unlinkAsset",
  "requestId": "<unique request identifier>",
  "result": {
    "asset": <asset>,
    "device": <device>
  }
}
```
