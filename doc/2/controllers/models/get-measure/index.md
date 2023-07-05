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
URL: http://kuzzle:7512/_/device-manager/models/measure/:_id
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

- `type`: The type of measure you want to retreive.

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
