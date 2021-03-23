---
code: true
type: page
title: clean
description: Cleans the payload collection
---

# clean

Cleans the payload collection.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/devices/_clean_
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/device",
  "action": "clean",
  "body": {
    //
  }
}
```

### Kourou

```bash
kourou device-manager/device:clean '{"days": <days>, "valid": "true|false", "deviceModel": "<deviceModel>"}'
```

---

## Arguments

- `days`: Specify on which period of time you want keep payloads (`default: 7`).
- `valid`: Specify which payloads are to be deleted (`default: true`).
- `deviceModel`: deviceModel name.

## Response

Returns an array with the deleted payloads ids.