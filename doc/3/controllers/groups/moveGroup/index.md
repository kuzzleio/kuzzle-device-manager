---
code: true
type: page
title: moveGroup
description: Moves a group to a new parent
---

# moveGroup

Moves a group to a new parent group.

This endpoint updates the group's path and cascades the changes to all descendant groups, assets, and devices.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/groups/:_id/_move
Method: PUT
```

### Other protocols

```js
{
  "controller": "device-manager/groups",
  "action": "moveGroup",
  "engineId": "<engineId>",
  "_id": "<group id>",
  "body": {
    "targetGroupId": "<target group id>"  // use "__root__" to move to root
  }
}
```

---

## Arguments

- `engineId`: Engine ID (required)
- `_id`: ID of the group to move (required)

## Body properties

- `targetGroupId`: ID of the destination parent group (required). Use the special value `"__root__"` to move the group to the root level.

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/groups",
  "action": "moveGroup",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<groupId>",
    "_source": {
      "name": "<group name>",
      "model": "<group model>",
      "path": "<new path>",
      "metadata": { },
      "lastUpdate": "<timestamp>"
    }
  }
}
```

---

## Errors

- Returns an error if the group is already at the root and `targetGroupId` is `"__root__"`.
- Returns an error if `targetGroupId` is the same as `_id` (cannot move a group into itself).
- Returns an error if `targetGroupId` is a descendant of the group being moved.
- Returns an error if the group is already a direct child of the target group.
