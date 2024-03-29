---
code: true
type: page
title: list
description: List available registered decoders
---

# List

List available registered decoders.

---

## Query Syntax

### HTTP

```http
URL: http://localhost:7512/_/device-manager/decoder/_list
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/decoder",
  "action": "list",
}
```

### Kourou

```bash
kourou device-manager/decoder:list
```
---

## Response

```js
{
  "action": "list",
  "controller": "device-manager/decoder",
  "error": null,
  "node": "knode-nine-hydra-22631",
  "requestId": "d888a8e1-2f80-4849-99d0-86ea70fe91e4",
  "result": {
    "decoders": [
      {
        "deviceModel": "DummyTemp",
        "deviceMeasures": [
          "temperature"
        ]
      },
      {
        "deviceModel": "DummyTempPosition",
        "deviceMeasures": [
          "temperature",
          "position"
        ]
      }
    ]
  },
  "status": 200,
  "volatile": null
}
```
