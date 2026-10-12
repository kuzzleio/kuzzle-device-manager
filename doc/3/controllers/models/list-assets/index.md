---
code: true
type: page
title: listAssets
description: Lists asset models
---

# listAssets

Lists asset models.

By default, the metadata of the [metadata referential](../../../concepts/models/index.md#metadata-referential) used by the models are resolved: their `{ "referential": true }` marker in `metadataMappings` is replaced by the referential mappings, and their `metadataDetails` and `defaultMetadata` are merged over the current referential values. Use `rawModel` to get the stored documents as is.

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
- `rawModel`: optional, `false` by default. If `true`, returns the stored models without resolving their referential metadata

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
