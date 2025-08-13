---
code: true
type: page
title: deleteMeasure
description: Deletes a measure model
---

# Delete Measure

Deletes a measure model.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/measure/:id
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "deleteMeasure",
  "_id": "<measure model _id>"
}
```

---

## Arguments

- `_id`: measure model id

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "deleteMeasure",
  "requestId": "<unique request identifier>"
}
```