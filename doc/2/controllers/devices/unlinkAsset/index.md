---
code: true
type: page
title: unlinkAsset
description: Unlinks a device from an asset
---

# unlinkAsset

Unlinks a device from an asset.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/devices/:_id/unlink
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/devices",
  "action": "unlinkAsset",
  "engineId": "<engineId>",
  "_id": "<deviceId>"
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
  "action": "unlinkAsset",
  "requestId": "<unique request identifier>",
}
```
