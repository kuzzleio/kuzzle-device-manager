---
code: true
type: page
title: unlinkDevices
description: Unlinks measures from an asset
---

# unlinkDevices

Unlinks measures from an asset.

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
    "linkedMeasures": [
      { "deviceId":"<id of the device>"
        "allMeasures": "<boolean>"                            // optional
        "measureSlots":[                                      // optional
            {
              "asset": "<name of the measure in the asset>",
              "device": "<name of the measure in the device>"
            }
        ]
    },
    {...}
    ]
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
