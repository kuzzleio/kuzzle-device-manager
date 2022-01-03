---
code: true
type: page
title: mAttachTenants
description: Attach multiple devices to multiple tenants index
---

# mAttachTenants

Attach multiple devices to multiple tenants.

The device document will be duplicated inside the tenant "devices" collection.

If a device does not exists on the list, process will throw a NotFoundError

---

## Query Syntax

### HTTP

``` http
URL: http://kuzzle:7512/_/device-manager/devices/_mAttach[?refresh=wait_for][&strict]
Method: PUT
Body:
```

``` js
{
    // Using JSON
    "records" [{
        "tenantId": "tenant-kuzzle",
        "deviceId": "test-id"
    }],
    // Using CSV syntax
    "csv": "tenantId,deviceId\ntenant-kuzzle,test-id"
}
```

### Other protocols

``` js
{
    "controller": "device-manager/device",
    "action": "mAttachTenants",
    "body": {
        // Using JSON
        "records" [{
            "tenantId": "tenant-kuzzle",
            "deviceId": "test-id"
        }],
        // Using CSV syntax
        "csv": "tenantId,deviceId\ntenant-kuzzle,test-id",
    }
}
```

---

## Body properties

Body properties, must contain at least one of

- `records`: an array of object containing `tenantId` and `deviceId`
- `csv`: a csv syntax compatible containing at least this two headers `tenantId,deviceId` with their corresponding values

---

### Optional:

* `refresh`: if set to `wait_for`, Kuzzle will not respond until the documents are indexed
* `strict`: (boolean) if set, makes the process fail preemptively if at least one link cannot be applied (e.g. devices that aren't attached to a tenant, or because of non-existing assets)

---

## Response

``` js
{
    "status": 200,
    "error": null,
    "controller": "device-manager/device",
    "action": "mAttachTenants",
    "requestId": "<unique request identifier>",
    "result": {
        "errors": [],
        "successes": []
    }
}
```

## Events

Two events when this action is called, allowing to modify the device before it is attached to tenant:

```js
app.pipe.register('device-manager:device:attach-tenant:before', async ({ index, device }) => {
  app.log.debug('before attach-tenant trigered');

  set(device, 'body.metadata.enrichedByBeforeAttachTenant', true);

  return { index, device };
})

app.pipe.register('device-manager:device:attach-tenant:after', async ({ index, device }) => {
  app.log.debug('after attach-tenant trigered');

  return { index, device };
})
```