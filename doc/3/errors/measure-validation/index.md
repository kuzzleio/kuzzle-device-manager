---
code: false
type: page
title: Measure Validation
description: Measure Validation | Kuzzle Documentation
---

# Measure Validation

A `MeasureValidationError` is thrown when the provided measures values could not be validated by the JSON schema. It can occur on creation of a measure.

**HTTP status**: 400

**Additional Properties:**

| property | type             | description                                          |
| -------- | ---------------- | ---------------------------------------------------- |
| `errors` | array of objects | List of invalid data from measures, by measures names. |

Here is an example of a `errors` field:
```js
[
  {
    "measureName": "magiculeExt",
    "validationErrors": [
      {
        "instancePath": "/magicule",
        "schemaPath": "#/properties/magicule/type",
        "keyword": "type",
        "params": {
          "type": "integer"
        },
        "message": "must be integer"
      }
    ]
  },
  {
    "measureName": "magiculeInt",
    "validationErrors": [
      {
        "instancePath": "/magicule",
        "schemaPath": "#/properties/magicule/type",
        "keyword": "type",
        "params": {
          "type": "integer"
        },
        "message": "must be integer"
      }
    ]
  }
]
```

Errors fields:
| field                | type             | description |
| -------------------- | ---------------- | ------------------------------------------------ |
| `measureName`        | string           | The measure name where validation errors occured |
| `validationErrors`   | array of objects | The list of validation errors (AJV formated)     |


The validation errors array contain standard AJV errors, please refer to their documentation about [errors](https://ajv.js.org/api.html#error-objects) for more informations. `instancePath`, in our case, refer to the model name.