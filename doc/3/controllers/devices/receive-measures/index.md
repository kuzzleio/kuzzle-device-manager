---
code: true
type: page
title: receiveMeasures
description: Receive formated measures for a device
---

# receiveMeasures

Receive formated measures for a device.

This action allows to receive measures without using a Decoder but it must be one of the measure defined in the device model.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/devices/:_id/measures
Method: PUT
```

### Other protocols

```js
{
  "controller": "device-manager/devices",
  "action": "receiveMeasures",
  "engineId": "<engineId>",
  "_id": "<deviceId>",
  "body": {
    "measures": [
      {
        "measureName": "<name of the measure>",
        "measuredAt": "<timestamp of the measure>",
        "type": "<type of the measure>",
        "values": {
          // values
        },
      }
    ],

    // Optional
    "payloadUuids": ["<uuid>"],
  }
}
```

---

## Arguments

- `engineId`: Engine ID
- `_id`: Device ID

## Body properties

- `payloadUuids`: Array of uuid identifying the received data
- `measures`: Array of formated measures

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/devices",
  "action": "receiveMeasures",
  "requestId": "<unique request identifier>",
}
```
