---
code: true
type: page
title: create
description: Creates a new asset
---

# create

Creates a new device inside a tenant index.

Returns an error if the document already exists.

A link request to an asset can be embedded in the querry with the body fields `assetId` and `measureNamesLinks`.

See also the [document:create](/core/2/api/controllers/document/create) API action.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/devices[?refresh=wait_for]
Method: POST
Body:
```

```js
{
  model: "DummyMultiTemp",
  reference: "ref1",
  metadata: {
    // optional
  },
  assetId: "<assetIdToLink>",  // optional
  measureNamesLinks: [
    // optional
  ]
}
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/asset",
  "action": "create",
  "body": {
    // device content
  }
}
```

### Kourou

```bash
kourou device-manager/asset:create <index> --body '{ 
  // device content
}'
```

---

## Arguments

- `index`: index name

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the newly created document is indexed
- `_id`: set the document unique ID to the provided value, instead of auto-generating an ID with the `type`, `model` and the `reference`

---

## Body properties

Device content to create.

Devices must contains at least the following properties:
  - `model`: Asset model designation
  - `reference`: Unique identifier scoped to a model

Devices can contain custom values in the `metadata` property.

---

## Response

Returns an object with the following properties:

- `_id`: created document unique identifier
- `_source`: document content
- `_version`: version of the created document (should be `1`)

```js
{
  "status": 200,
  "error": null,
  "index": "<index>",
  "controller": "device-manager/asset",
  "action": "create",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<assetId>",
    "_version": 1,
    "_source": {
      // ...
    },
  }
}
```
