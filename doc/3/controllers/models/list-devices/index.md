---
code: true
type: page
title: listDevices
description: Lists device models
---

# listDevices

Lists device models.

By default, the metadata of the [metadata referential](../../../concepts/models/index.md#metadata-referential) used by the models are resolved: their `{ "referential": true }` marker in `metadataMappings` is replaced by the referential mappings, and their `metadataDetails` and `defaultMetadata` are merged over the current referential values. Use `rawModel` to get the stored documents as is.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/devices
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "listDevices",
}
```

---

## Arguments

- `rawModel`: optional, `false` by default. If `true`, returns the stored models without resolving their referential metadata

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "listDevices",
  "requestId": "<unique request identifier>",
  "result": {
    "models": [
      {
        "_id": "<modelId>",
        "_source": {
          // Device model content
        },
      }
    ],
    "total": 42
  }
}
```
