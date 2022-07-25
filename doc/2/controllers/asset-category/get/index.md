---
code: true
type: page
title: delete
description: Deletes an asset-category
---

# get

Get an asset-category.

You can also use [document:get](/core/2/api/controllers/document/get) API action if you have proper rights, but if you use this specific controller, the data is preprocessed and easier to use.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assetCategory/:_id
Method: GET
```

### Other protocols

```js
{
  "engineId": "<engineId>",
  "controller": "device-manager/assetCategory",
  "action": "get",
  "_id": "<assetCategoryId>"
}
```

### Kourou

```bash
kourou device-manager/assetCategory:get <engineId> --id <assetCategoryId>
```

---

- `engineId`: engine id

---

## Response

```js
{
    "action": "get",
    "controller": "device-manager/assetCategory",
    "error": null,
    "headers": {},
    "node": "knode-accessible-orwell-15416",
    "requestId": "8fd1b8b5-1dfd-4fba-a12f-4b570622980e",
    "result": {
        "name": "myCategory",
        "assetMetadata": [
            {
                "mandatory": true,
                "name": "myMetadata",
                "valueType": "string"
            },
            {
                "mandatory": true,
                "name": "myOtherMetadata",
                "valueType": "string"
            }
        ],
        "metadataValues": {
            "myMetadata": "myValue"
        }
    },
    "status": 200,
    "volatile": null
}
```

