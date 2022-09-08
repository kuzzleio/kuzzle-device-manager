---
code: true
type: page
title: attachEngine
description: Attach a device to a tenant index
---

# attachEngine

Attach a device to a tenant.

The device document will be duplicated inside the tenant `devices` collection.

If the device does not exists, process will throw a NotFoundError.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/devices/:_id/_attach[?refresh=wait_for]
Method: PUT
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/device",
  "action": "attachEngine",
  "_id": "<deviceId>"
}
```

### Kourou

```bash
kourou device-manager/device:attachEngine <index> --id <deviceId>
```
---

## Arguments

- `index`: Tenant index name

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the documents are indexed

---

## Response

```js
{
  "status": 200,
  "error": null,
  "index": "<index>",
  "controller": "device-manager/device",
  "action": "attachEngine",
  "requestId": "<unique request identifier>",
  "result": {}
}
```

## Events

Two events when this action is called, allowing to modify the device before it is attached to tenant:

```js
app.pipe.register('device-manager:device:attach-tenant:before', async ({ index, device }) => {
  app.log.debug('before attach-tenant trigered');

  set(device, 'body.metadata.enrichedByBeforeattachEngine', true);

  return { index, device };
})

app.pipe.register('device-manager:device:attach-tenant:after', async ({ index, device }) => {
  app.log.debug('after attach-tenant trigered');

  return { index, device };
})
```
