---
code: true
type: page
title: create
description: Creates a new asset-category
---

# create

Creates a new asset-category inside a tenant index.

Returns an error if the document already exists.

See also the [document:create](/core/2/api/controllers/document/create) API action.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assetCategory[?refresh=wait_for]
Method: POST
Body:
```

```js
{
  // asset content
  //Exemple :
  {"name" : "myAsset"}
}
```

### Other protocols

```js
{
  "engineId": "<index>",
  "controller": "device-manager/assetCategory",
  "action": "create",
  "body": {
    // asset content
  }
}
```

### Kourou

```bash
kourou device-manager/assetCategory:create <engineId> --body '{ 
  name: "<asset category name>"
  }'
```

---

## Arguments

- `engineId`: engine id

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the newly created document is indexed
---

## Body properties

Asset content to create.

Assets must contains at least the following properties:
- `name`: Asset category name.

---

## Response

Returns an object with the following properties:

- `_id`: created document unique identifier
- `_source`: document content
- `_version`: version of the created document (should be `1`)
