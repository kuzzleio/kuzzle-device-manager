---
code: true
type: page
title: create
description: Creates an asset
---

# create

Creates an asset.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/assets
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "create",
  "index": "<index>",
  "body": {
    "model": "<asset model>",
    "reference": "<asset reference>",
    "metadata": {
      "<metadata name>": "<metadata value>"
    }
  }
}
```

---

## Arguments

- `index`: Engine ID

## Body properties

- `model`: Asset model name
- `reference`: Asset reference (must be unique within a model)
- `metadata`: Object containing metadata

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "create",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<assetId>",
    "_source": {
      // Asset content
    },
  }
}
```
