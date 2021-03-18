---
code: true
type: page
title: mDetach
description: Detach multiple sensors from multiple tenants
---

# mDetach

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
    "sensorIds" ["test-id"],
    // Using CSV syntax
    "csv": "sensorIds\ntest-id"
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
        "csv": "sensorIds\ntest-id"
    }
}
```

---

## Body properties

Body properties, must contain at least one of

* `sensorIds`: an array of string containing identifiers of a sensor already attached
* `csv`: a csv syntax compatible containing at least one header `sensorId` with his corresponding values
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
