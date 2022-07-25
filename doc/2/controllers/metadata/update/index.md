---
code: true
type: page
title: update
description: Updates a metadata
---

# update

Applies partial changes to a metadata.

See also the [document:update](/core/2/api/controllers/document/update) API action.

---

## Query Syntax

### HTTP

```http
URL: device-manager/:engineId/metadata/:_id[?refresh=wait_for][&retryOnConflict=<int>][&source]
Method: PUT
Body:
```

```js
{
  // metadata changes
}
```

### Other protocols

```js
{
  "engineId": "<engineId>",
  "controller": "device-manager/metadata",
  "action": "update",
  "_id": "<metadataId>",
  "body": {
    // metadata changes
  }
}
```

### Kourou

```bash
kourou device-manager/metadata:update <engineId> --id <metadataId> --body '{ 
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

Partial changes to apply to the metadata.

---

## Response

Returns information about the updated metadata:

- `_id`: metadata unique identifier
- `_version`: updated metadata version
- `_source`: contains only changes or the full metadata if `source` is set to `true`
