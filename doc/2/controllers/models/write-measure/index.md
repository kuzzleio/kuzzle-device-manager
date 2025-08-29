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
    "valuesDetails":{
      // Values details and translation
    },
      // Optional
    "validationSchema": {
      // Valid JSON Schema
    },
     // Optional
    "locales": {
      // Translations specific to the measure model
    }
  }
}
```

---

## Body properties

- `model`: Measure model name
- `valuesMappings`: Mappings of the measure values in Elasticsearch format
- `valuesDetails`: (optional) Measurement translations and units
- `validationSchema`: (optional) Measurement validation JSON schema
- `locales`: (optional) Translations specific to the measure model

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