---
code: true
type: page
title: importDevices
description: Link a device to an asset
---

# importDevices

Import devices from a CSV file

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/devices/_import[?refresh=wait_for]
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/device",
  "action": "importDevices",
  "body": {
    "csv": "qos.battery,measures.temperature.degree\\n80,23.3"
  }
}
```

### Kourou

```bash
kourou device-manager/device:importDevices --body '{ "csv": "qos.battery,measures.temperature.degree\\n80,23.3" }'
```
---

## Body properties

- `csv`: a csv syntax compatible containing at least this two headers `tenantId,deviceId` with their corresponding values

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
  "action": "importDevices",
  "requestId": "<unique request identifier>",
  "result": {}
}
```
