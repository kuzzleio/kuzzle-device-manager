---
code: true
type: page
title: create
description: Creates a group
---

# Create

Creates a group.

This endpoint allows you to create a new group in the Device Manager.  
You must specify a group name, and optionally a model, metadata, and an ancestry path.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/groups/:_id
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/groups",
  "action": "create",
  "engineId": "<engineId>",
  "_id": "<groupId>", // optional, auto-generated if missing
  "body": {
    "name": "<group name>",
    "model": "<group model>",      // optional
    "metadata": { ... },           // optional
    "path": "<direct parent group path>"         // optional
  }
}
```

---

## Arguments

- `engineId`: Engine ID (required)
- `_id`: Group ID (optional, auto-generated if missing)

## Body properties

- `name`: Name of the group (required, must be unique)
- `model`: Group model name (optional)
- `metadata`: Object containing group metadata (optional)
- `path`: Ancestry path for the group (optional, defaults to group ID)

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/groups",
  "action": "create",
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

- Returns an error if the group name is missing or already exists.
- Returns an error if the path is invalid or the parent group does not exist.