---
code: true
type: page
title: create
description: Creates a new sensor
---

# create

Creates a new sensor. 

See also [document:create](/core/2/api/controllers/document/create) API action.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/sensors/[?refresh=wait_for][&_id=<string>]
Method: POST
Body:
```

```js
{
  // sensor content
}
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/sensor",
  "action": "create",
  "_id": "<sensorId>",
  "body": {
    // sensor content
  }
}
```

---

## Arguments

- `index`: index name

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the create is indexed
- `_id`: set the document unique ID to the provided value, instead of auto-generating an ID with the `model` and the `reference`

---

## Body properties

Sensor content.

The body must at least contain the following properties:
  - `model`: sensor model designation
  - `reference`: sensor unique identifier for the model

---

## Response

Returns information about the created sensor:

- `_id`: created document unique identifier
- `_source`: document content
- `_version`: version of the created document (should be `1`)

```js
{
  "status": 200,
  "error": null,
  "index": "<index>",
  "controller": "device-manager/sensor",
  "action": "create",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<sensorId>",
    "_version": 2,
    "_source": "<sensor content>"
  }
}
```
