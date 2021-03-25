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
URL: http://kuzzle:7512/_/device-manager/device-manager/devices/_mDetach[?refresh=wait_for]
Method: PUT
Body:
```

``` js
{
    // Using JSON
    "deviceIds" ["test-id"],
    // Using CSV syntax
    "csv": "deviceId\ntest-id"
}
```

### Other protocols

``` js
{
    "controller": "device-manager/device",
    "action": "mAttachTenant",
    "body": {
        // Using JSON
        "deviceIds" ["test-id"],
        // Using CSV syntax
        "csv": "deviceId\ntest-id"
    }
}
```

---

## Body properties

Body properties, must contain at least one of

* `deviceIds`: an array of string containing identifiers of a device already attached
* `csv`: a csv syntax compatible containing at least one header `deviceId` with his corresponding values
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
    "controller": "device-manager/device",
    "action": "mDetach",
    "requestId": "<unique request identifier>",
    "result": {
        "errors": [],
        "successes": []
    }
}
```
