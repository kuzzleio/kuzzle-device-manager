---
code: true
type: page
title: delete
description: Delete a group
---

# Delete

Deletes a group.

This endpoint allows you to delete a group by its ID.  
If the group has child groups, assets, or devices referencing its path, those references will be automatically removed.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/groups/:_id
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/groups",
  "action": "delete",
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
  "action": "delete",
  "requestId": "<unique request identifier>"
}
```

---

## Errors

- Returns an error if the group does not exist.
- Returns an error if the group cannot be deleted due to business constraints.