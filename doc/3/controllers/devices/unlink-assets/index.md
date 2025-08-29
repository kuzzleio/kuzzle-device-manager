---
code: true
type: page
title: unlinkAssets
description: Unlinks measures from a device
---

# unlinkAssets

Unlinks measures from a devices.

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
    "linkedMeasures": [
      { "assetId":"<id of the asset>"
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
