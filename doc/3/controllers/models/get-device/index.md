---
code: true
type: page
title: getDevice
description: Gets an device model
---

# getDevice

Gets a device model.

By default, the metadata of the [metadata referential](../../../concepts/models/index.md#metadata-referential) used by the model are resolved: their `{ "referential": true }` marker in `metadataMappings` is replaced by the referential mappings, and their `metadataDetails` and `defaultMetadata` are merged over the current referential values. Use `rawModel` to get the stored document as is, e.g. to edit the model.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/device/:model
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "getDevice",
  "model": "<device model>",

  // optional:
  "rawModel": false
}
```

---

## Arguments

- `model`: device model
- `rawModel`: optional, `false` by default. If `true`, returns the stored model without resolving its referential metadata

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "getDevice",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<modelId>",
    "_source": {
      // Device model content
    },
  }
}
```
