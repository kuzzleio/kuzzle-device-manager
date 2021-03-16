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
  "_id": "<sensorId>",
  "assetId": "<assetId>"
}
```

### Kourou

```bash
kourou device-manager/device:linkAsset <index> --id <sensorId> -a assetId=<assetId>
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
