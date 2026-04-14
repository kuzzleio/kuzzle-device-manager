---
code: true
type: page
title: update
description: Update a group
---

# Update

Updates a group.

This endpoint allows you to update the properties of a group, such as its name or metadata.
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
      // other group properties
    }
  }
}
```

---

## Errors

- Returns an error if the new group name is missing or already exists.
- Returns an error if the group does not exist.