---
code: true
type: page
title: unlinkAssets
description: Unlinks measures from a device
---

# unlinkAssets

Unlinks measures from a devices. This action takes 3 optional parameters. One of them must be present. 
There are 3 ways to unlink measures:
        - One can unlink all of the device measure slots with the flag "allMeasures".
        - One can unlink all of the slots for specific assets with the array of assets' ids. 
        - One can specify the device measure slots to unlink.
        
It is possible to combine those parameters. 

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/devices/:_id/unlink
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/devices",
  "action": "unlinkAssets",
  "engineId": "<engineId>",
  "_id": "<deviceId>"
  "body": {
    "allMeasures": "<boolean>"                            // optional Indicates if all the measures from the device must be unlinked
    "assets":  "<string[]>"                              // optional List of assets' ids to completely unlink from the device
    "measureSlots":  "<string[]>"                         // optional List of device's measures slots to unlink
  },
}
```

---

## Arguments

- `engineId`: Engine ID
- `_id`: Device ID

## Body properties

- `linkedMeasures`: Array containing the link to establish, one per asset.
              - `assetId`: The id of the asset to unlink,
              - `allMeasures`: Boolean to unlink all linked measures. (optional)
              - `measureSlots` An array containing a corresponding table between device measure name and asset measure name. (optional)

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/devices",
  "action": "unlinkAssets",
  "requestId": "<unique request identifier>",
  "result": {
    "device": {
      "_id": "<deviceId>",
      "_source": {
        // Device content
      },
    },
    "assets":/*  
        Array<{
          "_id": "<assetId>",
          "_source": {
              // Asset content
        },
        }>, 
    */
  }
}
```
