---
code: true
type: page
title: mAttach
description: Attach multiple sensors to multiple tenants index
---

# mAttach

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
        "tenantId": "tenant-kuzzle",
        "sensorId": "test-id"
    }],
    // Using CSV syntax
    "csv": "tenant,id\ntenant-kuzzle,test-id"
}
```

### Other protocols

``` js
{
    "controller": "device-manager/sensor",
    "action": "mAttach",
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

- `records`: an array of object containing `tenantId` and `sensorId`
- `csv`: a csv syntax compatible containing at least this two headers `tenantId,sensorId` with their corresponding values
- `strict`: a boolean value that indicate if the process should fail at first error

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
    "action": "mAttach",
    "requestId": "<unique request identifier>",
    "result": {
        "errors": [],
        "successes": []
    }
}
```
