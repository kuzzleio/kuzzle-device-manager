---
code: true
type: page
title: delete
description: Deletes a sensor
---

# delete

Deletes a sensor.

See also [document:delete](/core/2/api/controllers/document/delete) API action.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/sensors/:_id[?refresh=wait_for][&source]
Method: DELETE
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/sensor",
  "action": "delete",
  "_id": "<sensorId>"
}
```

---

## Arguments

- `index`: index name

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the delete is indexed
- `source`: if set to `true` Kuzzle will return the entire deleted document body in the response.

---

## Response

Returns information about the deleted sensor:

- `_id`: sensor unique identifier
- `_source`: deleted sensor source, only if option `source` is set to `true`

```js
{
  "status": 200,
  "error": null,
  "index": "<index>",
  "controller": "device-manager/sensor",
  "action": "delete",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<sensorId>",
    "_source": "<deleted document>" // If `source` option is set to true
  }
}
```
