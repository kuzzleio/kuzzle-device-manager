---
code: true
type: page
title: deleteDevice
description: Deletes a device model
---

# Delete Device

Deletes a device model.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/device/:id
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "deleteDevice",
  "_id": "<device model _id>"
}
```

---

## Arguments

- `_id`: device model id

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "deleteDevice",
  "requestId": "<unique request identifier>"
}
```