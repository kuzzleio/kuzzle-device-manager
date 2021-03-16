---
code: true
type: page
title: create
description: Creates a new device
---

# create

Creates a new device.

See also the [document:create](/core/2/api/controllers/document/create) API action.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/devices/[?refresh=wait_for][&_id=<string>]
Method: POST
Body:
```

```js
{
  // device content
}
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/device",
  "action": "create",
  "body": {
    // device content
  }
}
```

### Kourou

```bash
kourou device-manager/device:create <index> --body '{
  model: "<device model>",
  reference: "<device reference>"
}'
```

---

## Arguments

- `index`: Tenant index name

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the device document is indexed
- `_id`: set the document unique ID to the provided value, instead of auto-generating an ID with the `model` and the `reference`

---

## Body properties

Device content.

The body must at least contain the following properties:
  - `model`: device model designation
  - `reference`: device unique identifier for the model

---

## Response

Returns information about the created device:

- `_id`: created document unique identifier
- `_source`: document content
- `_version`: version of the created document (should be `1`)

```js
{
  "status": 200,
  "error": null,
  "index": "<index>",
  "controller": "device-manager/device",
  "action": "create",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<sensorId>",
    "_version": 2,
    "_source": "<device content>"
  }
}
```
