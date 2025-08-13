---
code: true
type: page
title: removeDevice
description: Remove devices from a group
---

# Remove Device

Removes one or more devices from a group.

This endpoint allows you to dissociate devices from a group by specifying their IDs and the group's path.  
The devices will be unlinked from the group and their `groups` property will be updated accordingly.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/groups/removeDevice
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/groups",
  "action": "removeDevice",
  "engineId": "<engineId>",
  "body": {
    "path": "<group path>",
    "deviceIds": ["<deviceId1>", "<deviceId2>", ...]
  }
}
```

---

## Arguments

- `engineId`: Engine ID (required)

## Body properties

- `path`: Path of the group (required)
- `deviceIds`: Array of device IDs to remove from the group (required)

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/groups",
  "action": "removeDevice",
  "requestId": "<unique request identifier>",
  "result": {
    "successes": [
      { "_id": "<deviceId1>", "body": { /* updated device content */ } },
      { "_id": "<deviceId2>", "body": { /* updated device content */ } }
      // ...
    ],
    "errors": [
      // If any device update failed, error details here
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
- Returns an error if any device ID does not exist.