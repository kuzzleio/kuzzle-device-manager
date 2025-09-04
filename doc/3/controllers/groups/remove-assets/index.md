---
code: true
type: page
title: removeAssets
description: Remove assets from a group
---

# removeAssets

Removes one or more assets from a group.

This endpoint allows you to dissociate assets from a group by specifying their IDs and the group's path.  
The assets will be unlinked from the group and their `groups` property will be updated accordingly.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/groups/removeAssets
Method: POST
Body: {
  "path": "<group path>",
  "assetIds": ["<assetId1>", "<assetId2>", ...]
}
```

### Other protocols

```js
{
  "controller": "device-manager/groups",
  "action": "removeAssets",
  "engineId": "<engineId>",
  "body": {
    "path": "<group path>",
    "assetIds": ["<assetId1>", "<assetId2>", ...]
  }
}
```

---

## Arguments

- `engineId`: Engine ID (required)

## Body properties

- `path`: Path of the group (required)
- `assetIds`: Array of asset IDs to remove from the group (required)

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/groups",
  "action": "removeAssets",
  "requestId": "<unique request identifier>",
  "result": {
    "successes": [
      { "_id": "<assetId1>", "body": { /* updated asset content */ } },
      { "_id": "<assetId2>", "body": { /* updated asset content */ } }
      // ...
    ],
    "errors": [
      // If any asset update failed, error details here
    ],
    "group": {
      "_id": "<groupId>",
      "_source": {
        "name": "<group name>",
        "model": "<group model>",
        "metadata": { ... },
        "path": "<group path>",
        // other group properties
      }
    }
  }
}
```

---

## Errors

- Returns an error if the group path is invalid or does not exist.
- Returns an error if any asset ID does not exist.