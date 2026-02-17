---
code: true
type: page
title: listMeasures
description: Lists measure models
---

# listMeasures

Lists measure models.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/measures
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "listMeasures",

  // Optional
  "engineId": "<engine ID>"
}
```

---

## Arguments

- `engineId`: (optional) engine ID. When provided, returns both tenant-scoped measure models for this engine and global measure models. When omitted, returns only global measure models

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "listMeasures",
  "requestId": "<unique request identifier>",
  "result": {
    "models": [
      {
        "_id": "<modelId>",
        "_source": {
          // Measure model content
        },
      }
    ],
    "total": 42
  }
}
```
