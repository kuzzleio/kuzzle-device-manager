---
code: true
type: page
title: writeMeasure
description: Write a measure model
---

# writeMeasure

Write a measure model.

This action acts like a create or replace

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/measures
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "writeMeasure",
  "body": {
    "type": "<measure type>",
    "valuesMappings": {
      // Values mappings
    },
  }
}
```

---

## Body properties

- `model`: Measure model name
- `valuesMappings`: Mappings of the measure values in Elasticsearch format

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "writeMeasure",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<modelId>",
    "_source": {
      // Measure model content
    },
  }
}
```
