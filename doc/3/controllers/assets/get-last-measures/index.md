---
code: true
type: page
title: getLastMeasures
description: Retrieves the last measures of an asset
---

# getLastMeasures

Retrieves the last measures of an asset.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/assets/:_id/lastMeasures
Method: GET or POST
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "getLastMeasures",
  "index": "<index>",
  "_id": "<assetId>",

  // optional:
  "measureCount": "<measure count>"
}
```

---

## Arguments

- `index`: engine id
- `_id`: asset id
- `measureCount`: set the maximum number of measures returned

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "getLastMeasures",
  "requestId": "<unique request identifier>",
  "result": {
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
  }
}
```
