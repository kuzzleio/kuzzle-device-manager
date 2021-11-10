---
code: true
type: page
title: mUnlinkAsset
description: Unlink multiple devices from multiple assets
---

# mUnlinkAsset

Unlink multiple devices from multiple assets

---

## Query Syntax

### HTTP

``` http
URL: http://kuzzle:7512/_/device-manager/devices/_mUnlink[?refresh=wait_for][&strict]
Method: PUT
Body:
```

``` js
{
    // Using JSON
    "records" [{
        "deviceId": "test-id"
    }],
    // Using CSV syntax
    "csv": " deviceId\ntest-id"
}
```

### Other protocols

``` js
{
    "controller": "device-manager/device",
    "action": "mUnlinkAsset",
    "body": {
        // Using JSON
        "records" [{
            "deviceId": "test-id"
        }],
        // Using CSV syntax
        "csv": "deviceId\ntest-id",
    }
}
```

---

## Body properties

Body properties, must contain at least one of the following:

- `records`: an array of objects, each containing a `deviceId` properties
- `csv`: a csv syntax compatible containing at least this header `deviceId` with his corresponding values

---

### Optional:

* `refresh`: if set to `wait_for`, Kuzzle will not respond until the documents are indexed
* `strict`: (boolean) if set, makes the process fail preemptively if at least one Unlink cannot be applied (e.g. devices that aren't attached to a tenant, or because of non-existing assets)

---

## Response

``` js
{
    "status": 200,
    "error": null,
    "controller": "device-manager/device",
    "action": "mUnlinkAsset",
    "requestId": "<unique request identifier>",
    "result": {
        "errors": [],
        "successes": []
    }
}
```
