---
code: true
type: page
title: delete
description: Deletes an asset-category
---

# delete

Deletes an asset-category.

See also the [document:delete](/core/2/api/controllers/document/delete) API action.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assetCategory/:_id[?refresh=wait_for][&source]
Method: DELETE
```

### Other protocols

```js
{
  "engineId": "<engineId>",
  "controller": "device-manager/assetCategory",
  "action": "delete",
  "_id": "<assetCategoryId>"
}
```

### Kourou

```bash
kourou device-manager/assetCategory:delete <engineId> --id <assetCategoryId>
```

---

## Arguments

- `engineId`: engine id
- `_id`: id of element to delete

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the delete is indexed
- `source`: if set to `true` Kuzzle will return the entire deleted document body in the response.

---

## Response

Returns information about the deleted assetCategory:

- `_id`: assetCategory unique identifier
