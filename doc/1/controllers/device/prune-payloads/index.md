---
code: true
type: page
title: prunePayloads
description: Cleans the payload collection
---

# prunePayloads

Delete payloads according to their age and/or validity and/or to which device model they are affiliated with.

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
  keepInvalid: true|false,
  deviceModel: "<deviceModel>"
}'
```

---

## Arguments

- `days`: The maximum age of a payload, in days (`default: 7`).
- `keepInvalid`: If set to `true`, invalid payloads will not be deleted.
- `deviceModel`: deviceModel name.

## Response

Returns the number of deleted payloads.
