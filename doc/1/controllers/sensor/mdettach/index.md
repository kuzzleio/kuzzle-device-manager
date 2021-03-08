---
code: true
type: page
title: detach
description: Detach multiple sensors from multiple tenants
---

# detach

Detach multiple sensors from multiple tenants.

---

## Query Syntax

### HTTP

``` http
URL: http://kuzzle:7512/_/device-manager/device-manager/sensors/_mDetach[?refresh=wait_for]
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
            "tenantId": "tenant-kuzzle",
            "sensorId": "test-id"
        }],
        // Using CSV syntax
        "csv": "tenantId,sensorId\ntenant-kuzzle,test-id",
    }
}
```

---

## Body properties

Body properties, must contain at least one of

* `records`: an array of object containing `tenantId` and `sensorId`
* `csv`: a csv syntax compatible containing at least this two headers `tenantId,sensorId` with their corresponding values
* `strict`: a boolean value that indicate if the process should fail at first error

---

## Arguments

### Optional:

* `refresh`: if set to `wait_for`, Kuzzle will not respond until the documents are indexed

---

## Response

``` js
{
    "status": 200,
    "error": null,
    "index": "<index>",
    "controller": "device-manager/sensor",
    "action": "mDetach",
    "requestId": "<unique request identifier>",
    "result": {
        "errors": [],
        "successes": []
    }
}
```
