---
code: true
type: page
title: create
description: Creates a new asset
---

# create

Creates a new asset inside a tenant index.

Returns an error if the document already exists.

See also the [document:create](/core/2/api/controllers/document/create) API action.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/assets[?refresh=wait_for]
Method: POST
Body:
```

```js
{
  // asset content
}
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/asset",
  "action": "create",
  "body": {
    // asset content
  }
}
```

### Kourou

```bash
kourou device-manager/asset:create <index> --body '{ 
  type: "<asset type>", 
  model: "<asset model>", 
  reference: "<asset reference>" 
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

Asset content to create.

Assets must contains at least the following properties:
  - `model`: Asset model designation
  - `reference`: Unique identifier scoped to a model

Assets can contain custom values in the `metadata` property.

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
