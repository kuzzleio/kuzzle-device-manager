---
code: true
type: page
title: deleteGroup
description: Deletes a group model
---

# deleteGroup

Deletes a group model.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/group/:id
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "deleteGroup",
  "_id": "<group model _id>"
}
```

---

## Arguments

- `_id`: group model id

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "deleteGroup",
  "requestId": "<unique request identifier>",
}
```
