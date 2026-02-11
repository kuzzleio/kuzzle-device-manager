---
code: true
type: page
title: create
description: Remove measure slot
---

# removeMeasureSlot

Removes a measure slot from an asset.
It can only remove a measure slot that is not linked to a device and that is not defined in the asset model.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:_id/measure-slot/
Method: delete
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "removeMeasureSlot",
  "engineId": "<engineId>",
  "_id":"<asset _id>"
  "body": {
    "measureSlot":"string"
    }
  }
}
```

---

## Arguments

- `engineId`: Engine ID
- `_id`: Asset ID

## Body properties

- `measureSlot`: The asset name of the measure slot

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "removeMeasureSlot",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<assetId>",
    "_source": {
      // Asset content
    },
  }
}
```
