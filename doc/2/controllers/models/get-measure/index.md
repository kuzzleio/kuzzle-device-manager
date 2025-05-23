---
code: true
type: page
title: getMeasure
description: Gets a measure model
---

# getMeasure

Gets a measure model.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/measure/:type
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "getMeasure",
  "type": "<measure type>"
}
```

---

## Arguments

- `type`: measure type

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "getMeasure",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<modelId>",
    "_source": {
      // Measure model content
    },
  }
}
```
