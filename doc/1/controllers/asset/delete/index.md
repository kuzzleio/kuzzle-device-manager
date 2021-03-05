---
code: true
type: page
title: delete
description: Deletes an asset
---

# delete

Deletes an asset.

See also the [document:delete](/core/2/api/controllers/document/delete) API action.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/assets/:_id[?refresh=wait_for][&source]
Method: DELETE
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/asset",
  "action": "delete",
  "_id": "<assetId>"
}
```

### Kourou

```bash
kourou device-manager/asset:delete <index> --id <assetId>
```

---

## Arguments

- `index`: index name

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the delete is indexed
- `source`: if set to `true` Kuzzle will return the entire deleted document body in the response.

---

## Response

Returns information about the deleted asset:

- `_id`: asset unique identifier
- `_source`: deleted asset source, only if the `source` option is set to `true`

```js
{
  "status": 200,
  "error": null,
  "index": "<index>",
  "controller": "device-manager/asset",
  "action": "delete",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<assetId>",
    "_source": "<deleted document>" // If `source` option is set to true
  }
}
```
