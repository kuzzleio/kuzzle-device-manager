---
code: true
type: page
title: unlinkDevices
description: Unlinks measures from an asset
---

# unlinkDevices

Unlinks measures from an asset. This action takes 3 optional parameters. One of them must be present. 
There are 3 ways to unlink measures:
        - One can unlink all of the asset measure slots with the flag "allMeasures".
        - One can unlink all of the slots for specific devices with the array of devices' ids. 
        - One can specify the asset measure slots to unlink.

It is possible to combine those parameters. 

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:_id/unlink
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "unlinkDevices",
  "engineId": "<engineId>",
  "_id": "<assetId>"
  "body": {
    "allMeasures": "<boolean>"                            // optional Indicates if all the measures from the asset must be unlinked
    "devices":  "<string[]>"                              // optional List of devices' ids to completely unlink from the asset
    "measureSlots":  "<string[]>"                         // optional List of asset's measures slots to unlink
  },
}
```

---

## Arguments

- `engineId`: Engine ID
- `_id`: Asset ID

## Body properties

- `linkedMeasures`: Array containing the link to establish, one per asset.
              - `deviceId`: The id of the device to unlink,
              - `allMeasures`: Boolean to unlink all linked measures. (optional)
              - `measureSlots` An array containing a corresponding table between device measure name and asset measure name. (optional)

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "unlinkDevices",
  "requestId": "<unique request identifier>",
  "result": {
    "asset": {
      "_id": "<asset>",
      "_source": {
        // Asset content
      },
    },
    "devices":/*  
        Array<{
          "_id": "<deviceId>",
          "_source": {
              // Device content
        },
        }>, 
    */
  }
}
```
