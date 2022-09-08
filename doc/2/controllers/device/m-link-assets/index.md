---
code: true
type: page
title: mLinkAssets
description: Link multiple devices to multiple assets
---

# mLinkAssets

Link multiple devices to multiple assets.

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
  "linkRequests": [
    {
      "assetId": "<assetId>",
      "deviceLink": {
        "deviceId": "<deviceId>",
        "measureNamesLinks": [     // Optional, see TODO : (device:LinkAsset) 
          {
            "assetMeasureName": "<assetMeasureName>",
            "deviceMeasureName": "<deviceMeasureName>"
          },
          ...
        ]
      }
    },
    ...
  ]
}
```

### Other protocols

``` js
{
  "controller": "device-manager/device",
  "action": "mLinkAssets",
  "body": {
    "linkRequests": [
      {
        "assetId": "<assetId>",
        "deviceLink": {
          "deviceId": "<deviceId>",
          "measureNamesLinks": [     // Optional, see TODO : (device:LinkAsset) 
            {
              "assetMeasureName": "<assetMeasureName>",
              "deviceMeasureName": "<deviceMeasureName>"
            },
            ...
          ]
        }
      },
      ...
    ]
  }
}
```

---

## Body properties

Body properties, must contain a list of object containing :
- An assetId
- The [`deviceLink`](TODO : Link to deviceLink type)

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
  "action": "mLinkAssets",
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
## Events

Two events when this action is called, allowing to modify the device before it is linked to the asset:

```js
import set from 'lodash/set';

app.pipe.register('device-manager:device:link-asset:before', async ({ device, asset }) => {
  app.log.debug('before link-asset triggered');

  set(asset, 'body.metadata.enrichedByBeforeLinkAsset', true);

  return { device, asset };
})

app.pipe.register('device-manager:device:link-asset:after', async ({ device, asset }) => {
  app.log.debug('after link-asset triggered');

  return { device, asset };
})
```
