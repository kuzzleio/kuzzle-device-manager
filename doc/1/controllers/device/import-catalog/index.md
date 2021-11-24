---
code: true
type: page
title: importCatalog
description: Provisioning of the device catalog via csv import
---

# importCatalog

Provisioning of the device catalog via csv import

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/devices/_catalog[?refresh=wait_for]
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/device",
  "action": "importCatalog",
  "body": {
    "csv": "deviceId,authorized\nDummyTemp-imported,false"
  }
}
```

### Kourou

```bash
kourou device-manager/device:importCatalog --body '{ "csv": "deviceId,authorized\nDummyTemp-imported,false" }'
```
---

## Body properties

- `csv`: a csv syntax compatible containing at least this two headers `deviceId,authorized` with their corresponding values

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
  "action": "importCatalog",
  "requestId": "<unique request identifier>",
  "result": {}
}
```
