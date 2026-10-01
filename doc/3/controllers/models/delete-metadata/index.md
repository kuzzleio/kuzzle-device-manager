---
code: true
type: page
title: deleteMetadata
description: Deletes a metadata of the metadata referential
---

# deleteMetadata

Deletes a metadata of the metadata referential.

The request is rejected if a model still references the metadata.

A metadata registered with `deviceManager.models.registerMetadata` is written again at the next startup.

See [Metadata Referential](../../../concepts/models/index.md#metadata-referential).

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/metadata/:name
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "deleteMetadata",
  "name": "<metadata name>"
}
```

---

## Arguments

- `name`: metadata name

---

## Response

Returns the updated metadata referential.

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "deleteMetadata",
  "requestId": "<unique request identifier>",
  "result": {
    // Remaining metadata
  }
}
```

## Errors

- A [ BadRequestError ](https://docs.kuzzle.io/core/2/api/errors/types/#badrequesterror) (400) is thrown if a model still references the metadata, or if the metadata is registered from code (`managed`)
- A [ NotFoundError ](https://docs.kuzzle.io/core/2/api/errors/types/#notfounderror) (404) is thrown if the metadata does not exist
