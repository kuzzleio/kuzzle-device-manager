---
code: true
type: page
title: listDecoders
description: List available registered decoders
---

# linkAsset

List available registered decoders.

---

## Query Syntax

### HTTP

```http
URL: http://localhost:7512/_/device-manager/devices/_listDecoders
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/device",
  "action": "listDecoders",
}
```

### Kourou

```bash
kourou device-manager/device:listDecoders
```
---

## Response

```js
{
  "action": "listDecoders",
  "controller": "device-manager/device",
  "error": null,
  "node": "knode-shaggy-salmon-94717",
  "requestId": "e74e2d34-6699-4dbf-8f38-874c6d2b9e1a",
  "result": {
    "size": 2,
    "decoders": [
      "DummyTemp",
      "DummyTempPosition"
    ]
  },
  "status": 200,
  "volatile": null
}
```
