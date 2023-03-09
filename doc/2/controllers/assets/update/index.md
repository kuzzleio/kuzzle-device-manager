---
code: true
type: page
title: update
description: Updates an asset
---

# update

Updates an asset.

Only the `metadata` can be updated.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:_id
Method: PUT
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "update",
  "engineId": "<engineId>",
  "_id": "<assetId>",
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
  "controller": "device-manager/assets",
  "action": "update",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<assetId>",
    "_source": {
      // Asset content
    },
  }
}
```
