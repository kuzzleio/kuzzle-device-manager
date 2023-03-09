---
code: true
type: page
title: get
description: Gets an asset
---

# get

Gets an asset.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:_id
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "get",
  "engineId": "<engineId>",
  "_id": "<assetId>"
}
```

---

## Arguments

- `engineId`: engine id
- `_id`: asset id

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "get",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<assetId>",
    "_source": {
      // Asset content
    },
  }
}
```
