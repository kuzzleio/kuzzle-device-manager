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
  "node": "knode-common-carpenter-91992",
  "requestId": "94ea97c3-18af-4a7e-a848-3760b9761c98",
  "result": {
    "decoders": [
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
    ]
  },
  "status": 200,
  "volatile": null
}
```
