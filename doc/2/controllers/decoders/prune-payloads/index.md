---
code: true
type: page
title: prunePayloads
description: Clean payload collection for a time period
---

# Prune payloads

Clean payload collection for a time period.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/decoders/_prunePayloads
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/decoders",
  "action": "prunePayloads",
  "body":{
    "days":number,
    "deviceModel":string,
    "onlyValid":boolean
  }
}
```
---

## Body Arguments

- `days`: number of days of payloads to preserve
- `deviceModel`: (optional) specific device model filter for the payloads to delete
- `onlyValid`: (default true) should delete only valid payloads

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/devices",
  "action": "delete",
  "requestId": "<unique request identifier>",
  "result": {
    "deleted":12
  }
}
```
