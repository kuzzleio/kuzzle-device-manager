---
code: true
type: page
title: list
description: List available registered decoders
---

# linkAsset

List available registered decoders.

---

## Query Syntax

### HTTP

```http
URL: http://localhost:7512/_/device-manager/decoders/_list
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/decoders",
  "action": "list",
}
```

### Kourou

```bash
kourou device-manager/decoders:list
```
---

## Response

```js
{
  "action": "list",
  "controller": "device-manager/decoders",
  "error": null,
  "node": "knode-abrasive-manatee-50960",
  "requestId": "ea8fcab2-dfb2-44d5-880d-cbe1d69696b6",
  "result": [
    {
      "payloadsMappings": {
        "deviceEUI": {
          "type": "keyword"
        }
      },
      "deviceModel": "DummyTemp",
      "action": "dummy-temp"
    },
    {
      "payloadsMappings": {},
      "deviceModel": "DummyTempPosition",
      "action": "dummy-temp-position"
    }
  ],
  "status": 200,
  "volatile": null
}
```
