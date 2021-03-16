---
code: true
type: page
title: delete
description: Deletes a device
---

# delete

Deletes a device.

See also the [document:delete](/core/2/api/controllers/document/delete) API action.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/devices/:_id[?refresh=wait_for][&source]
Method: DELETE
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/device",
  "action": "delete",
  "_id": "<sensorId>"
}
```

### Kourou

```bash
kourou device-manager/device:delete <index> --id <sensorId>
```

---

## Arguments

- `index`: Tenant index name

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the document is removed from the search indexes
- `source`: if set to `true` Kuzzle will return the entire deleted document body in the response.

---

## Response

Returns information about the deleted device:

- `_id`: device unique identifier
- `_source`: deleted device source, only if option `source` is set to `true`

```js
{
  "status": 200,
  "error": null,
  "index": "<index>",
  "controller": "device-manager/device",
  "action": "delete",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<sensorId>",
    "_source": "<deleted document>" // If `source` option is set to true
  }
}
```
