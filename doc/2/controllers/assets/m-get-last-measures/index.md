---
code: true
type: page
title: mGetLastMeasures
description: Retrieves the last measures of multiple assets
---

# mGetLastMeasures

Retrieves the last measures of multiple assets.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/_mGetLastMeasures
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "mGetLastMeasures",
  "engineId": "<engineId>",
  "body": {
    "ids": ["<assetId>", "<anotherAssetId>"]
  }
}
```

---

## Arguments

- `engineId`: engine id

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
  "action": "mGetLastMeasures",
  "requestId": "<unique request identifier>",
  "result": {
    "<assetId>": {
      "<firstMeasure>": {
        "measuredAt": 42,
        "name": "<firstMeasure>",
        "originId": "<originId>",
        "payloadUuids": [
          // Payload UUIDs
        ],
        "type": "<measureType>",
        "values": {
          // Measure values
        }
      },
      "<secondMeasure>": {
        // ...
      }
    },
    "<anotherAssetId>": {
      // ...
    }
  }
}
```
