---
code: true
type: page
title: update
description: Updates an asset-category
---

# update

Applies partial changes to an asset-Category.

See also the [document:update](/core/2/api/controllers/document/update) API action.

---

## Query Syntax

### HTTP

```http
URL: device-manager/:engineId/assetCategory/:_id[?refresh=wait_for][&retryOnConflict=<int>][&source]
Method: PUT
Body:
```

```js
{
  //  asset-category changes
}
```

### Other protocols

```js
{
  "engineId": "<engineId>",
  "controller": "device-manager/assetCategory",
  "action": "update",
  "_id": "<assetCategoryId>",
  "body": {
    // metadata changes
  }
}
```

### Kourou

```bash
kourou device-manager/assetCategory:update <engineId> --id <assetCategoryId> --body '{ 
  // asset changes
}'
```

---

## Arguments

- `engineId`: engine Id

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the update is indexed
- `retryOnConflict`: conflicts may occur if the same document gets updated multiple times within a short timespan, in a database cluster. You can set the `retryOnConflict` optional argument (with a retry count), to tell Kuzzle to retry the failing updates the specified amount of times before rejecting the request with an error.
- `source`: if set to `true` Kuzzle will return the entire updated document body in the response.

---

## Body properties

Partial changes to apply to the assetCategory.

---

## Response

Returns information about the updated assetCategory:

- `_id`: assetCategory unique identifier
- `_version`: updated assetCategory version
- `_source`: contains only changes or the full assetCategory if `source` is set to `true`
