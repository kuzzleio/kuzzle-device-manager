---
code: true
type: page
title: writeAsset
description: Write an asset model
---

# writeAsset

Write an asset model.

This action acts like a create or replace

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/assets
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "writeAsset",
  "body": {
    "engineGroup": "<engine group>",
    "model": "<asset model>",

    // Optional

    "metadataMappings": {
      // Metadata mappings
    },
    "defaultValues": {
      // Default values for metadata
    }
    "measures": [
      // Array of measure definition with type and name
    ]
  }
}
```

---

## Body properties

- `engineGroup`: Name of the engine group
- `model`: Asset model name
- `metadataMappings`: Mappings of the metadata in Elasticsearch format
- `defaultValues`: Default values for the metadata
- `measures`: Array of measure definition. Each item define a `type` and `name` properties for the measure.

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "writeAsset",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<modelId>",
    "_source": {
      // Asset model content
    },
  }
}
```
