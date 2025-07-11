---
code: true
type: page
title: getGroup
description: Gets a group model
---

# getGroup

Gets a group model.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/group/:model
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "getGroup",
  "model": "<group model>"
}
```

---

## Arguments

- `model`: group model

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "getGroup",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<modelId>",
    "_source": {
      // Group model content
    },
  }
}
```
