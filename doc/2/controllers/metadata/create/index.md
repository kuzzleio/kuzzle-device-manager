---
code: true
type: page
title: create
description: Creates a new metadata type
---

# create

Creates a new metadata type inside a tenant index.

Returns an error if the document already exists.

See also the [document:create](/core/2/api/controllers/document/create) API action.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/metadata[?refresh=wait_for]
Method: POST
Body:
```

```js
{
  // metadata type content
  //Example : 
  "name" : "model",
  "valueType" : "string",
  "mandatory" : true
  
}
```

### Other protocols

```js
{
  "engineId": "<engineId>",
  "controller": "device-manager/metadata",
  "action": "create",
  "body": {
    //metadata content
  }
}
```

### Kourou

```bash
kourou device-manager/metadata:create <engineId> --body '{ 
  //metadata content 
}'
```

---

## Arguments

- `engineId`: engine Id

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the newly created document is indexed

---

## Body properties

metadata type content to create.

Assets must contains at least the following properties:
- `name`: name of the metadata
- `valueType`: type of the metadata

---

## Response

Returns an object with the following properties:

- `_id`: created document unique identifier
- `_source`: document content
- `_version`: version of the created document (should be `1`)

