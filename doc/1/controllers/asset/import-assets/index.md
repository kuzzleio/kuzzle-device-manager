---
code: true
type: page
title: importAssets
description: Import assets using csv
---

# importAssets

Import assets using csv

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
kourou device-manager/asset:importAssets --body '{ "csv": require("fs").readFileSync("/absolute/path/assets.csv", "utf8") }'
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
  "controller": "device-manager/asset",
  "action": "importAssets",
  "requestId": "<unique request identifier>",
  "result": {}
}
```
