---
code: true
type: page
title: listGroups
description: Lists group models
---

# listGroups

Lists group models.

By default, the metadata of the [metadata referential](../../../concepts/models/index.md#metadata-referential) used by the models are resolved: their `{ "referential": true }` marker in `metadataMappings` is replaced by the referential mappings, and their `metadataDetails` and `defaultMetadata` are merged over the current referential values. Use `rawModel` to get the stored documents as is.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/groups
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "listGroups",
  "tenantClasses": ["<tenant class>"]
}
```

---

## Arguments

- `tenantClasses`: names of the tenant classes
- `rawModel`: optional, `false` by default. If `true`, returns the stored models without resolving their referential metadata

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "listGroups",
  "requestId": "<unique request identifier>",
  "result": {
    "models": [
      {
        "_id": "<modelId>",
        "_source": {
          // Group model content
        },
      }
    ],
    "total": 42
  }
}
```
