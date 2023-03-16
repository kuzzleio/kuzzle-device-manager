---
code: true
type: page
title: linkAsset
description: Links a device with an asset
---

# linkAsset

Links a device with an asset.

This action is idempotent for a device, meaning that you can replace an existing link (e.g. adding new measures) by sending another request with the same device ID.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/devices/:_id/_link/:assetId
Method: PUT
```

### Other protocols

```js
{
  "controller": "device-manager/devices",
  "action": "linkAsset",
  "engineId": "<engineId>",
  "_id": "<deviceId>"
  "assetId": "<assetId>"
  "body": {
    "measureNames": [
      {
        "asset": "<name of the measure in the asset>",
        "device": "<name of the measure in the device>"
      }
    ]
  },

  // optional
  "implicitMeasuresLinking": "<boolean>"
}
```

---

## Arguments

- `engineId`: Engine ID
- `_id`: Device ID
- `assetId`: Asset ID
- `implicitMeasuresLinking`: If true, matching measures will be automatically linked using their names

## Body properties

- `measureNames`: Array containing the corresponding table between device measure name and asset measure name

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/devices",
  "action": "linkAsset",
  "requestId": "<unique request identifier>",
  "result": {
    "device": {
      "_id": "<deviceId>",
      "_source": {
        // Device content
      },
    },
    "asset": {
      "_id": "<deviceId>",
      "_source": {
        // Asset content
      },
    },
  }
}
```
