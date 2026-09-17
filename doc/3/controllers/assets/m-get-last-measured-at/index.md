---
code: true
type: page
title: mGetLastMeasuredAt
description: Retrieves the date of the last measure of multiple assets
---

# mGetLastMeasuredAt

Retrieves the date of the last measure of multiple assets.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/assets/_mGetLastMeasuredAt
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "mGetLastMeasuredAt",
  "index": "<index>",
  "body": {
    "ids": ["<assetId>", "<anotherAssetId>"]
  }
}
```

---

## Arguments

- `index`: engine id

---

## Body properties

- `ids`: an array of asset identifiers 

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "mGetLastMeasuredAt",
  "requestId": "<unique request identifier>",
  "result": {
    "<assetId>": 42,
    "<anotherAssetId>": 1337
  }
}
```
