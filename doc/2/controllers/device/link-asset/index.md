---
code: true
type: page
title: linkAsset
description: Link a device to an asset
---

# linkAsset

Link a device to an asset. It will bind a `deviceMeasureName` to an `assetMeasureName` for the device. Each asset will take the most recent measures with a unique `assetMeasureName` in its document.

It will save the `assetId` in the device document and a [`deviceLink`](TODO : DeviceLink type link) in the assetDocument.

If no `measureNamesLinks` is given, it will bind each `deviceMeasureName` of the decoder's `decoderMeasures` to the same `assetMeasureName`.

If the device is already linked to an asset, it will replace the `deviceLink` of the asset document with the new one.

Example:

```js
// decoderMeasures of the device model
{
  deviceTemperature: "temperature",
  deviceBattery: "battery",
}

// deviceLink created in the asset
{
  deviceId: "<deviceId>",
  measureNamesLinks: [
    {
      assetMeasureName: "deviceTemperature",
      deviceMeasureName: "deviceTemperature"
    },
    {
      assetMeasureName: "deviceBattery",
      deviceMeasureName: "deviceBattery"
    }
  ]
}
```

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/devices/:_id/_linkAsset/:assetId[?refresh=wait_for]
Method: PUT
```

```js
{
  "measureNamesLinks": [
    {
      "assetMeasuresName": "myAssetTemperature",
      "deviceMeasureName": "myDeviceTemperature"
    }
  ]
}
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/device",
  "action": "linkAsset",
  "_id": "<deviceId>",
  "assetId": "<assetId>"
  "body": {
    "measureNamesLinks": [
      {
        "assetMeasuresName": "myAssetTemperature",
        "deviceMeasureName": "myDeviceTemperature"
      }
    ]
  }
}
```

### Kourou

```bash
kourou device-manager/device:linkAsset <index> --id <deviceId> -a assetId=<assetId>
```
---

## Arguments

- `index`: Tenant index name
- `assetId`: Asset unique identifier

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the documents are indexed

---

## Response

```js
{
  "status": 200,
  "error": null,
  "index": "<index>",
  "controller": "device-manager/device",
  "action": "linkAsset",
  "requestId": "<unique request identifier>",
  "result": {
    "asset": <asset>,
    "device": <device>
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
