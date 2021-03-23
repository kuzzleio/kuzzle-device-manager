---
code: true
type: page
title: clean
description: Cleans the payload collection
---

# clean

Cleans payloads according to their age and/or validity and/or to which device model they are affiliated.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/devices/_clean
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
kourou device-manager/device:clean '{
  days: <days>,
  valid: true|false,
  deviceModel: "<deviceModel>"
}'
```

---

## Arguments

- `days`: Specify on which period of time you want keep payloads (`default: 7`).
- `valid`: Specify if valid, invalid or both payload should be deleted (`default: true`).
- `deviceModel`: deviceModel name.

## Response

Returns the number of deleted payloads.