---
code: true
type: page
title: update
description: Update a group
---

# Update

Updates a group.

This endpoint allows you to update the properties of a group, such as its name, metadata, or ancestry path.  
If the group's path is changed, all child groups, assets, and devices referencing the old path will be updated accordingly.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/groups/:_id
Method: PUT
```

### Other protocols

```js
{
  "controller": "device-manager/groups",
  "action": "update",
  "engineId": "<engineId>",
  "_id": "<groupId>",
  "body": {
    "name": "<new group name>",    // optional
    "metadata": { ... },           // optional
    "path": "<new group path>"     // optional
  }
}
```

---

## Arguments

- `engineId`: Engine ID (required)
- `_id`: Group ID (required)

## Body properties

- `name`: New name for the group (optional, must be unique)
- `metadata`: Object containing updated group metadata (optional)
- `path`: New hierarchical path for the group (optional, must be valid)

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/groups",
  "action": "update",
  "requestId": "<unique request identifier>",
  "result": {
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
```

---

## Errors

- Returns an error if the new group name is missing or already exists.
- Returns an error if the new path is invalid or the parent group does not exist.
- Returns an error if the group does not exist.