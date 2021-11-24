---
code: true
type: page
title: importAssets
description: Import asset using csv
---

# importAssets

Import asset using csv

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/assets/_import[?refresh=wait_for]
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/asset",
  "action": "importAssets",
  "body": {
    "csv": "_id,reference,model\nPERFO-imported,imported,PERFO"
  }
}
```

### Kourou

```bash
kourou device-manager/asset:importAssets --body '{ "csv": "_id,reference,model\nPERFO-imported,imported,PERFO" }'
```
---

## Body properties

- `csv`: a csv syntax compatible

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
  "action": "importAssets",
  "requestId": "<unique request identifier>",
  "result": {}
}
```
