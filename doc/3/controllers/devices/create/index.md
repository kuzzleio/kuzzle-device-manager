---
code: true
type: page
title: create
description: Creates a device
---

# create

Creates a device.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/devices
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/devices",
  "action": "create",
  "engineId": "<engineId>",
  "body": {
    "model": "<device model>",
    "reference": "<device reference>",
    "metadata": {
      "<metadata name>": "<metadata value>"
    }
  }
}
```

---

## Arguments

- `engineId`: Engine ID

## Body properties

- `model`: Device model name
- `reference`: Device reference (must be unique within a model)
- `metadata`: Object containing metadata

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/devices",
  "action": "create",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<deviceId>",
    "_source": {
      // Device content
    },
  }
}
```
