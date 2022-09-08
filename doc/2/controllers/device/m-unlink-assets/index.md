---
code: true
type: page
title: mUnlinkAssets
description: Unlink multiple devices from multiple assets
---

# mUnlinkAssets

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
  "deviceIds": [
    "<deviceId>",
    ...
  ] 
}
```

### Other protocols

``` js
{
  "controller": "device-manager/device",
  "action": "mUnlinkAssets",
  "body": {
    "deviceIds": [
      "<deviceId>",
      ...
    ]
  }
}
```

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
  "action": "mUnlinkAssets",
  "requestId": "<unique request identifier>",
  "result": {
    "invalids": [
      {
        "asset": <asset>,
        "device": <device>
      },
      ...
    ],
    "valids": [
      {
        "error": <error>,
        "linkRequest": <linkRequest>
      },
      ...
    ]
  }
}
```
