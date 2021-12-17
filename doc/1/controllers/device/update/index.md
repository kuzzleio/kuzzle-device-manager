---
code: true
type: page
title: update
description: Updates a device
---

# update

Applies partial changes to a device.

See also the [document:update](/core/2/api/controllers/document/update) API action.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/devices/:_id[?refresh=wait_for][&retryOnConflict=<int>][&source]
Method: PUT
Body:
```

```js
{
  // device changes
}
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/device",
  "action": "update",
  "_id": "<deviceId>",
  "body": {
    // device changes
  }
}
```

### Kourou

```bash
kourou device-manager/device:update <index> --id <deviceId> --body '{
  // device changes
}'
```

---

## Arguments

- `index`: Tenant index name

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the update is indexed
- `retryOnConflict`: conflicts may occur if the same document gets updated multiple times within a short timespan, in a database cluster. You can set the `retryOnConflict` optional argument (with a retry count), to tell Kuzzle to retry the failing updates the specified amount of times before rejecting the request with an error.
- `source`: if set to `true` Kuzzle will return the entire updated document body in the response.

---

## Body properties

Partial changes to apply to the device.

---

## Response

Returns information about the updated device:

- `_id`: device unique identifier
- `_version`: updated device version
- `_source`: contains only changes or the full device if `source` is set to `true`

```js
{
  "status": 200,
  "error": null,
  "index": "<index>",
  "controller": "device-manager/device",
  "action": "update",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<deviceId>",
    "_version": 2,
    "_source": "<partial or entire document>"
  }
}
```

## Events

Two events can be registered before/after the update of a device:

```js
app.pipe.register('device-manager:device:update:before', async ({ device, updates }) => {
  app.log.debug('before device update triggered');

  set(updates, 'metadata.enrichedByBeforeUpdateDevice', true);

  return { device, updates }
})

app.pipe.register('device-manager:device:update:after', async ({ device, updates }) => {
  app.log.debug('after device update triggered');


  return { device, updates }
})
```
