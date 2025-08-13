---
code: true
type: page
title: get
description: Get a group
---

# Get

Retrieves a group by its ID.

This endpoint allows you to fetch the details of a group, including its name, model, metadata, path, and other properties.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/groups/:_id
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/groups",
  "action": "get",
  "engineId": "<engineId>",
  "_id": "<groupId>"
}
```

---

## Arguments

- `engineId`: Engine ID (required)
- `_id`: Group ID (required)

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/groups",
  "action": "get",
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

- Returns an error if the group does not exist.