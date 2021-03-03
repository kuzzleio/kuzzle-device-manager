---
code: true
type: page
title: mAttachTenant
description: Attach multiple sensors to multiple tenant index
---

# mAttachTenant

Attach multiple sensors to multiple tenants.

The sensor document will be duplicated inside the tenant "sensors" collection.

---

## Query Syntax

### HTTP

``` http
URL: http://kuzzle:7512/_/device-manager/sensors/_mAttach
Method: PUT
Body:
```

``` js
{
    // Using JSON
    "records" [{
        "tenant": "tenant-kuzzle",
        "id": "test-id"
    }],
    // Using CSV syntax
    "csv": "tenant,id\ntenant-kuzzle,test-id"
}
```

### Other protocols

``` js
{
    "controller": "device-manager/sensor",
    "action": "mAttachTenant",
    "body": {
        // Using JSON
        "records" [{
            "tenant": "tenant-kuzzle",
            "id": "test-id"
        }],
        // Using CSV syntax
        "csv": "tenant,id\ntenant-kuzzle,test-id",
    }
}
```

---

## Body properties

Body properties, must contain at least one of

- `records`: an array of object containing `tenant` and `id`
- `csv`: a csv syntax compatible `tenant,id`

---

### Optional:

* `refresh`: if set to `wait_for`, Kuzzle will not respond until the documents are indexed

---

## Response

``` js
{
    "status": 200,
    "error": null,
    "controller": "device-manager/sensor",
    "action": "mAttachTenant",
    "requestId": "<unique request identifier>",
    "result": {}
}
```
