---
type: page
code: true
title: list
description: Lists available Device Manager engines
---

# list

Lists available Device Management engines.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/engines
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/engine",
  "action": "list",
}
```

### Kourou

```bash
kourou device-manager/engine:list <index>
```
---

## Response

Returns an object with an `engines` property containing the engines list.

```js
{
  "requestId": "d16d5e8c-464a-4589-938f-fd84f46080b9",
  "status": 200,
  "error": null,
  "controller": "device-manager/engine",
  "action": "list",
  "collection": null,
  "index": null,
  "result": { 
    "engines": [
      { "index": "tenant-ayse" },
      { "index": "tenant-kadikoy" },
    ]
  }
}
```
