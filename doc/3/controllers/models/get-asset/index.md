---
code: true
type: page
title: getAsset
description: Gets an asset model
---

# getAsset

Gets an asset model.

By default, the metadata of the [metadata referential](../../../concepts/models/index.md#metadata-referential) used by the model are resolved: their `{ "referential": true }` marker in `metadataMappings` is replaced by the referential mappings, and their `metadataDetails` and `defaultMetadata` are merged over the current referential values. Use `rawModel` to get the stored document as is, e.g. to edit the model.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/asset/:model
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "getAsset",
  "tenantClasses": ["<tenant class>"],
  "model": "<asset model>",

  // optional:
  "index": "<index>",
  "rawModel": false
}
```

---

## Arguments

- `tenantClasses`: names of the tenant classes
- `model`: asset model
- `index`: optional. Engine ID (tenant ID) to resolve tenant-scoped models. When provided, a tenant-scoped model takes priority over a group-scoped model of the same name. Falls back to group-scoped, then commons.
- `rawModel`: optional, `false` by default. If `true`, returns the stored model without resolving its referential metadata

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "getAsset",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<modelId>",
    "_source": {
      // Asset model content
    },
  }
}
```
