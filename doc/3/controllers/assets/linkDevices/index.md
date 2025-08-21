---
code: true
type: page
title: linkDevices
description: Links an asset with several devices
---

# linkDevices

Link one or several measure slots of an asset with one or several devices.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:_id/_link
Method: PUT
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "linkDevices",
  "engineId": "<engineId>",
  "_id": "<assetId>"
  "body": {
    "linkedMeasures": [
      { "deviceId":"<id of the device>"
        "implicitMeasuresLinking": "<boolean>"                // optional
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

- `linkedMeasures`: Array containing the link to establish, one per device.
              - `deviceId`: The id of the asset to link,
              - `implicitMeasuresLinking`: Boolean to link all linkable measures. (optional)
              - `measureSlots` An array containing a corresponding table between device measure name and asset measure name. (optional)

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "linkDevices",
  "requestId": "<unique request identifier>",
  "result": {
    "asset": {
      "_id": "<assetId>",
      "_source": {
        // Asset content
      },
    },
    "devices":/*  
        Array<{
          "_id": "<deviceId>",
          "_source": {
              // device content
        },
        }>, 
    */
  }
}
```
