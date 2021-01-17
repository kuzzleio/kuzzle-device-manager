---
code: true
type: page
title: link
description: Assign a sensor to a tenant index
---

# link

Link a sensor to an asset.

The sensor measures will be copied into the asset.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/sensors/_:id/_link/:assetId[?refresh=wait_for]
Method: PUT
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/sensor",
  "action": "link",
  "_id": "<sensorId>",
  "assetId": "<assetId>"
}
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
  "controller": "device-manager/sensor",
  "action": "link",
  "requestId": "<unique request identifier>",
  "result": {}
}
```
