---
code: true
type: page
title: linkAsset
description: Link a device to an asset
---

# linkAsset

Link a device to an asset.

The device measures will be copied into the asset.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/devices/:_id/_linkAsset/:assetId[?refresh=wait_for]
Method: PUT
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/device",
  "action": "linkAsset",
  "_id": "<deviceId>",
  "assetId": "<assetId>"
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
  "result": {}
}
```

## Events

Two events when this action is called, allowing to modify the device before it is linked to the asset:

```js
import set from 'lodash/set';

app.pipe.register('device-manager:device:link-asset:before', async ({ device, asset }) => {
  app.log.debug('before link-asset trigered');

  set(asset, 'body.metadata.enrichedByBeforeLinkAsset', true);

  return { device, asset };
})

app.pipe.register('device-manager:device:link-asset:after', async ({ device, asset }) => {
  app.log.debug('after link-asset trigered');

  return { device, asset };
})
```