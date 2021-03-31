---
code: true
type: page
title: mLink
description: Link multiple devices to multiple assets
---

# mLink

Link multiple devices to multiple assets

---

## Query Syntax

### HTTP

``` http
URL: http://kuzzle:7512/_/device-manager/devices/_mLink[?refresh=wait_for][&strict]
Method: PUT
Body:
```

``` js
{
    // Using JSON
    "records" [{
        "assetId": "myAssetId",
        "deviceId": "test-id"
    }],
    // Using CSV syntax
    "csv": "assetId, deviceId\nmyAssetId,test-id"
}
```

### Other protocols

``` js
{
    "controller": "device-manager/device",
    "action": "mLink",
    "body": {
        // Using JSON
        "records" [{
            "assetId": "myAssetId",
            "deviceId": "test-id"
        }],
        // Using CSV syntax
        "csv": "assetId,deviceId\nmyAssetId,test-id",
    }
}
```

---

## Body properties

Body properties, must contain at least one of the following:

- `records`: an array of objects, each containing an `assetId` and a `deviceId` properties
- `csv`: a csv syntax compatible containing at least this two headers `assetId,deviceId` with their corresponding values

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
    "action": "mLink",
    "requestId": "<unique request identifier>",
    "result": {
        "errors": [],
        "successes": []
    }
}
```
