---
code: true
type: page
title: addDevice
description: Add devices to a group
---

# Add Device

Adds one or more devices to a group.

This endpoint allows you to associate devices with a group by specifying their IDs and the group's path.  
The devices will be linked to the group and their `groups` property will be updated accordingly.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/groups/addDevice
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/groups",
  "action": "addDevice",
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
- `deviceIds`: Array of device IDs to add to the group (required)

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/groups",
  "action": "addDevice",
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