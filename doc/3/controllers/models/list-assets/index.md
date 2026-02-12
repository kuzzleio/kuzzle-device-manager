---
code: true
type: page
title: listAssets
description: Lists asset models
---

# listAssets

Lists asset models.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/assets
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "listAssets",
  "engineGroup": "<engineGroup>",

  // optional:
  "engineId": "<engineId>"
}
```

---

## Arguments

- `engineGroup`: name of the engine group
- `engineId`: optional. Engine ID (tenant ID) to filter models for. When provided, results include models scoped to that specific tenant, models scoped to the engine group, and commons models (3-level fallback). When absent, only group and commons models are returned.

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "listAssets",
  "requestId": "<unique request identifier>",
  "result": {
    "models": [
      {
        "_id": "<modelId>",
        "_source": {
          // Asset model content
        },
      }
    ],
    "total": 42
  }
}
```
