---
code: true
type: page
title: mDetach
description: Detach multiple devices from multiple tenants
---

# mDetach

Detach multiple devices from multiple tenants.

---

## Query Syntax

### HTTP

``` http
URL: http://kuzzle:7512/_/device-manager/device-manager/devices/_mDetach[?refresh=wait_for][&strict=true|false]
Method: PUT
Body:
```

``` js
{
    // Using JSON
    "sensorIds" ["test-id"],
    // Using CSV syntax
    "csv": "sensorId\ntest-id"
}
```

### Other protocols

``` js
{
    "controller": "device-manager/sensor",
    "action": "mAttachTenant",
    "body": {
        // Using JSON
        "sensorIds" ["test-id"],
        // Using CSV syntax
        "csv": "sensorId\ntest-id"
    }
}
```

---

## Body properties

Body properties, must contain at least one of

* `sensorIds`: an array of string containing identifiers of a sensor already attached
* `csv`: a csv syntax compatible containing at least one header `sensorId` with his corresponding values

---

### Optional:

* `refresh`: if set to `wait_for`, Kuzzle will not respond until the documents are indexed
* `strict`: a boolean value that indicate if the process should fail at first error

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
