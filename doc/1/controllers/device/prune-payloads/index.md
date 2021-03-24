---
code: true
type: page
title: prunePayloads
description: Cleans the payload collection
---

# prunePayloads

Delete payloads according to their age and/or validity and/or to which device model they are affiliated.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/devices/_prunePayloads
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/device",
  "action": "prunePayloads",
  "body": {
    //
  }
}
```

### Kourou

```bash
kourou device-manager/device:prunePayloads '{
  days: <days>,
  valid: true|false,
  deviceModel: "<deviceModel>"
}'
```

---

## Arguments

- `days`: The maximum age of a payload, in days (`default: 7`).
- `valid`: Specify if valid or invalid payloads should be deleted (`default: true`).
- `deviceModel`: deviceModel name.

## Response

Returns the number of deleted payloads.