---
code: true
type: page
title: update
description: Updates a device
---

# update

Updates a device.

Only the `metadata` can be updated.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/devices/:_id
Method: PUT
```

### Other protocols

```js
{
  "controller": "device-manager/devices",
  "action": "update",
  "engineId": "<engineId>",
  "_id": "<deviceId>",
  "body": {
    "metadata": {
      "<metadata name>": "<metadata value>"
    }
  }
}
```

---

## Arguments

- `engineId`: Engine ID
- `_id`: Asset ID

## Body properties

- `metadata`: Object containing metadata

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/devices",
  "action": "update",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<deviceId>",
    "_source": {
      // Device content
    },
  }
}
```
