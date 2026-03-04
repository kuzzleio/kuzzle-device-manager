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

    // Optional
    "engineIds": ["<engineId>", "..."],
    "valuesDetails":{
      // Values details and translation
    },
    "validationSchema": {
      // Valid JSON Schema
    }
  }
}
```

---

## Body properties

- `type`: Measure type name
- `valuesMappings`: Mappings of the measure values in Elasticsearch format
- `engineIds`: (optional) Array of engine IDs to scope this measure model to specific tenants. When omitted, the measure model is global. A measure type cannot be both global and tenant-scoped — creating a tenant-scoped measure when a global one of the same type exists (or vice versa) will be rejected
- `valuesDetails`: (optional) Measurement translations and units
- `validationSchema`: (optional) Measurement validation JSON schema

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

## Errors

Writing a measure with values mappings can cause conflicts, in this case a [ MappingsConflictsError ](../../../errors/mappings-conflicts/index.md) will be thrown with the HTTP code **409**.