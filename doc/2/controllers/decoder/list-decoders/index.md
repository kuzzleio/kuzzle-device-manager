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
  "node": "knode-nine-hydra-22631",
  "requestId": "d888a8e1-2f80-4849-99d0-86ea70fe91e4",
  "result": {
    "decoders": [
      {
        "decoderMeasures": {
          "theTemperature": "temperature",
          "theBatteryLevel": "battery"
        },
        "deviceModel": "DummyTemp"
      },
      {
        "decoderMeasures": {
          "innerTemp": "temperature",
          "outerTemp": "temperature",
          "lvlBattery": "battery"
        },
        "deviceModel": "DummyMultiTemp"
      },
      {
        "decoderMeasures": {
          "theTemperature": "temperature",
          "theBattery": "battery",
          "thePosition": "position"
        },
        "deviceModel": "DummyTempPosition"
      }
    ]
  },
  "status": 200,
  "volatile": null
}
```
