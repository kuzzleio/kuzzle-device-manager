---
code: true
type: page
title: mGetLastMeasuredAt
description: Retrieves the date of the last measure of multiple devices 
---

# mGetLastMeasuredAt

Retrieves the date of the last measure of multiple devices.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/devices/_mGetLastMeasuredAt
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/devices",
  "action": "mGetLastMeasuredAt",
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
  "action": "mGetLastMeasuredAt",
  "requestId": "<unique request identifier>",
  "result": {
    "<deviceId>": 42,
    "<anotherDeviceId>": 1337
  }
}
```
