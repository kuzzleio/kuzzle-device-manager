---
code: true
type: page
title: writeDevice
description: Write a device model
---

# writeDevice

Write a device model.

This action acts like a create or replace

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/devices
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "writeDevice",
  "body": {
    "model": "<device model>",

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

- `model`: Device model name
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
  "action": "writeDevice",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<modelId>",
    "_source": {
      // Device model content
    },
  }
}
```
