---
code: true
type: page
title: getDevice
description: Gets an device model
---

# getDevice

Gets an device model.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/device/:_id
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "getDevice",
  "engineId": "<engineId>",
  "_id": "<modelId>"
}
```

---

## Arguments

- `engineId`: engine id
- `_id`: device model id

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "getDevice",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<modelId>",
    "_source": {
      // Device model content
    },
  }
}
```
