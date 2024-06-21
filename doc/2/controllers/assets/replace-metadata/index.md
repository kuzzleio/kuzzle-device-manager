---
code: true
type: page
title: replaceMetadata
description: Replace asset metadata
---

# replaceMetadata

Replace `metadata` of an asset. It will replace only the fields specified in the request body.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:_id/metadata
Method: PATCH
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "replaceMetadata",
  "engineId": "<engineId>",
  "_id": "<assetId>",
  "body": {
    "metadata": {
      "<metadata name>": "<metadata value>"
    }
  }
}
```

## Arguments

- `engineId`: Engine ID
- `_id`: Asset ID

## Body properties

- `metadata`: Object containing metadata

## Response

```json
{
    "action": "replaceMetadata",
    "collection": "assets",
    "controller": "device-manager/assets",
    "error": null,
    "headers": {},
    "index": /** index */,
    "node": /** node */,
    "requestId": /** request id */,
    "result": {
        "_id": /** asset id */,
        "_source": {
            "groups": [],
            "lastMeasuredAt": null,
            "linkedDevices": [],
            "measures": {
                /** mesures */
            },
            "metadata": {
                /** REPLACED METADATA */
            },
            "model": /** asset model */,
            "reference": /** asset reference */,
            "_kuzzle_info": {
                /** data management info */
            }
        }
    },
    "status": 200,
    "volatile": null
}
```