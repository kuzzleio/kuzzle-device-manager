---
code: true
type: page
title: listAssets
description: Lists asset models
---

# listAssets

Lists asset models.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/assets
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "listAssets",
  "engineGroup": "<engineGroup>"
}
```

---

## Arguments

- `engineGroup`: name of the engine group

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "listAssets",
  "requestId": "<unique request identifier>",
  "result": {
    "models": [
      {
        "_id": "<modelId>",
        "_source": {
          // Asset model content
        },
      }
    ],
    "total": 42
  }
}
```
