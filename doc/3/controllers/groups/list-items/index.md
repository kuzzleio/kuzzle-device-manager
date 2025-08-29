---
code: true
type: page
title: listItems
description: List assets and devices in a group
---

# List Items

Lists the assets and devices associated with a group.

This endpoint allows you to retrieve all assets and devices linked to a group, optionally including items from child groups.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/groups/:_id/listItems
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/groups",
  "action": "listItems",
  "engineId": "<engineId>",
  "_id": "<groupId>",
  "body": {
    "includeChildren": true, // optional, default: false
    "from": <offset>,        // optional
    "size": <limit>          // optional
  }
}
```

---

## Arguments

- `engineId`: Engine ID (required)
- `_id`: Group ID (required)

## Body properties / Query parameters

- `includeChildren`: Boolean, whether to include items from child groups (optional, default: false)
- `from`: Offset for pagination (optional)
- `size`: Limit for pagination (optional)

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/groups",
  "action": "listItems",
  "requestId": "<unique request identifier>",
  "result": {
    "assets": {
      "hits": [
        { "_id": "<assetId>", "_source": { /* asset content */ } },
        // ...
      ],
      "total": <number of matching assets>
    },
    "devices": {
      "hits": [
        { "_id": "<deviceId>", "_source": { /* device content */ } },
        // ...
      ],
      "total": <number of matching devices>
    }
  }
}
```

---

## Errors

- Returns an error if the group does not exist.