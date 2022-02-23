---
type: page
code: true
title: delete
description: Deletes a Device Manager engine from an index
---

# delete

Deletes a Device Manager engine from an index

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/engine/:index
Method: DELETE
```

### Other protocols

```js
{
  "controller": "device-manager/engine",
  "action": "delete",
  "index": "engine-ayse",
}
```

### Kourou

```bash
kourou device-manager/engine:delete <index>
```
---
