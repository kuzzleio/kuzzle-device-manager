---
code: true
type: page
title: getDevice
description: Gets an device model
---

# getDevice

Gets a device model.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/device/:model
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "getDevice",
  "model": "<modelId>"
}
```

---

## Arguments

- `model`: device model id

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
