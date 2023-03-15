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
URL: http://kuzzle:7512/_/device-manager/models/asset/:_id
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "getAsset",
  "engineGroup": "<engineGroup>",
  "_id": "<modelId>"
}
```

---

## Arguments

- `engineGroup`: name of the engine group
- `_id`: asset model id

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
