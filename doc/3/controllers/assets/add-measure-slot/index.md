---
code: true
type: page
title: create
description: Add measure slot
---

# addMeasureSlot

Adds a measure slot to an asset.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:_id/measure-slot/
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "addMeasureSlot",
  "engineId": "<engineId>",
  "_id":"<asset _id>"
  "body": {
    "measureSlot":{
      "name":"string"
      "type":"string"
    }
    }
  }
}
```

---

## Arguments

- `engineId`: Engine ID
- `_id`: Asset ID

## Body properties

- `measureSlot`: The measure slot to be added 
          - `name`: Asset name of the measure slot
          - `type`: The type of measure

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "addMeasureSlot",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<assetId>",
    "_source": {
      // Asset content
    },
  }
}
```
