---
code: true
type: page
title: deleteAsset
description: Deletes an asset model
---

# Delete Asset

Deletes an asset model.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/asset/:id
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "deleteAsset",
  "_id": "<asset model _id>"
}
```

---

## Arguments

- `_id`: asset model id

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "deleteAsset",
  "requestId": "<unique request identifier>"
}
```