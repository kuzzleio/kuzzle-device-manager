---
code: true
type: page
title: delete
description: Deletes an asset
---

# delete

Deletes an asset.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:assetId
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "delete",
  "engineId": "<engineId>",
  "_id": "<assetId>"
}
```

---

## Arguments

- `engineId`: engine id
- `_id`: asset id

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "delete",
  "requestId": "<unique request identifier>",
  "result": null
}
```
