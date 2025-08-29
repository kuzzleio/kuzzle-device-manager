---
code: true
type: page
title: mGetLastMeasures
description: Retrieves the last measures of multiple devices
---

# mGetLastMeasures

Retrieves the last measures of multiple devices.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/devices/_mGetLastMeasures
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/devices",
  "action": "mGetLastMeasures",
  "engineId": "<engineId>",
  "body": {
    "ids": ["<deviceId>", "<anotherDeviceId>"]
  }
}
```

---

## Arguments

- `engineId`: engine id

---

## Body properties

- `ids`: an array of device identifiers 

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/devices",
  "action": "mGetLastMeasures",
  "requestId": "<unique request identifier>",
  "result": {
    "<deviceId>": {
      "<firstMeasure>": {
        "measuredAt": 42,
        "name": "<firstMeasure>",
        "originId": "<originId>",
        "payloadUuids": [
          // Payload UUIDs
        ],
        "type": "<measureType>",
        "values": {
          // Measure values
        }
      },
      "<secondMeasure>": {
        // ...
      }
    },
    "<anotherDeviceId>": {
      // ...
    }
  }
}
```
