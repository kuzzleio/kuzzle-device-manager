---
code: true
type: page
title: listDevices
description: Lists device models
---

# listDevices

Lists device models.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/devices
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "listDevices",
}
```

---

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "listDevices",
  "requestId": "<unique request identifier>",
  "result": {
    "models": [
      {
        "_id": "<modelId>",
        "_source": {
          // Device model content
        },
      }
    ],
    "total": 42
  }
}
```
