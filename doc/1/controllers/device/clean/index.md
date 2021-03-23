---
code: true
type: page
title: cleanPayloads
description: Cleans the payload collection
---

# cleanPayloads

Cleans payloads according to their age and/or validity and/or to which device model they are affiliated.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/devices/_cleanPayloads
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/device",
  "action": "cleanPayloads",
  "body": {
    //
  }
}
```

### Kourou

```bash
kourou device-manager/device:cleanPayloads '{
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