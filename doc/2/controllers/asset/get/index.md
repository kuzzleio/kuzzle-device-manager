---
code: true
type: page
title: delete
description: Deletes an asset-category
---

# get

Get an asset.

You can also use [document:get](/core/2/api/controllers/document/get) API action if you have proper rights, but if you use this specific controller, the data is preprocessed and easier to use.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:_id
Method: GET
```

### Other protocols

```js
{
  "engineId": "<engineId>",
  "controller": "device-manager/assets",
  "action": "get",
  "_id": "<assetId>"
}
```

### Kourou

```bash
kourou device-manager/assets:get <engineId> --id <assetId>
```

---

- `engineId`: engine id

---

## Response

```js
{
  "action": "get",
    "controller": "device-manager/asset",
    "error": null,
    "headers": {},
    "node": "knode-goofy-tapir-79868",
    "requestId": "40b528b5-1f89-4a96-9d73-f424652ffff7",
    "result": {
      "type": "type",
      "model": "model",
      "reference": "REF1003",
      "category": {
        "name": "T3",
        "assetMetadata": [
          {
            "mandatory": false,
            "name": "position",
            "valueType": "geo_point"
          },
          {
            "mandatory": true,
            "name": "color",
            "valueList": [
              "red",
              "blue",
              "green"
            ],
            "valueType": "enum"
          }
        ],
        "metadataValues": {}
      },
      "metadata": {
        "position": {
          "lon": 10, 
          "lat": 20
        },
        "color": "red"
      },
      "measures": [],
      "deviceLinks": [],
      "_kuzzle_info": {
      "author": "-1",
      "createdAt": 1658999673193,
      "updatedAt": null,
      "updater": null
    }
  },
  "status": 200,
  "volatile": null
}
```

