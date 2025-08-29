---
code: true
type: page
title: getAsset
description: Gets an asset model
---

# getAsset

Gets an asset model.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/asset/:model
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "getAsset",
  "engineGroup": "<engineGroup>",
  "model": "<asset model>"
}
```

---

## Arguments

- `engineGroup`: name of the engine group
- `model`: asset model

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "getAsset",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<modelId>",
    "_source": {
      // Asset model content
    },
  }
}
```
