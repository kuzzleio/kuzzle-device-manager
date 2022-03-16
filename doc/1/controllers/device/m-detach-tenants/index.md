---
code: true
type: page
title: mDetachEngines
description: Detach multiple devices from multiple tenants
---

# mDetachEngines

Detach multiple devices from multiple tenants.

---

## Query Syntax

### HTTP

``` http
URL: http://kuzzle:7512/_/device-manager/device-manager/devices/_mDetach[?refresh=wait_for][&strict]
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
    "action": "mDetachEngines",
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
    "index": "<index>",
    "controller": "device-manager/device",
    "action": "mDetachEngines",
    "requestId": "<unique request identifier>",
    "result": {
        "errors": [],
        "successes": []
    }
}
```
