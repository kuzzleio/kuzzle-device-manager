---
code: true
type: page
title: update
description: Updates an asset
---

# update

Applies partial changes to an asset. 

See also the [document:update](/core/2/api/controllers/document/update) API action.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/assets/:_id[?refresh=wait_for][&retryOnConflict=<int>][&source]
Method: PUT
Body:
```

```js
{
  // asset changes
}
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/asset",
  "action": "update",
  "_id": "<assetId>",
  "body": {
    // asset changes
  }
}
```

### Kourou

```bash
kourou device-manager/asset:update <index> --id <assetId> --body '{ 
  // asset changes
}'
```

---

## Arguments

- `index`: index name

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the update is indexed
- `retryOnConflict`: conflicts may occur if the same document gets updated multiple times within a short timespan, in a database cluster. You can set the `retryOnConflict` optional argument (with a retry count), to tell Kuzzle to retry the failing updates the specified amount of times before rejecting the request with an error.
- `source`: if set to `true` Kuzzle will return the entire updated document body in the response.

---

## Body properties

Partial changes to apply to the asset.

---

## Response

Returns information about the updated asset:

- `_id`: asset unique identifier
- `_version`: updated asset version
- `_source`: contains only changes or the full asset if `source` is set to `true`

```js
{
  "status": 200,
  "error": null,
  "index": "<index>",
  "controller": "device-manager/asset",
  "action": "update",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<assetId>",
    "_version": 2,
    "_source": "<partial or entire document>"
  }
}
```

## Events

Two events are triggered by this action, that can be used as follow:

```js
app.pipe.register('device-manager:asset:update:before', async ({ asset, updates }) => {
  app.log.debug('before asset update triggered');

  set(updates, 'metadata.enrichedByBeforeAssetUpdate', true);

  return { asset, updates };
})

app.pipe.register('device-manager:asset:update:after', async ({ asset, updates }) => {
  app.log.debug('after asset update triggered');

  if (updates.metadata.enrichedByBeforeAssetUpdate) {
    set(updates, 'metadata.enrichedByAfterAssetUpdate', true);

    await app.sdk.document.update(
      updates.metadata.index,
      'assets',
      asset._id,
      updates,
    )
  }

  return { asset, updates };
})

```
