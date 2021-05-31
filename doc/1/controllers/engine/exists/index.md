---
type: page
code: true
title: exists
description: Checks if a device manager engine exists on an index
---

# exists


Checks if a device manager engine exists on an index

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/engine/:index/_exists
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/engine",
  "action": "exists",
  "index": "tenant-ayse"
}
```

### Kourou

```bash
kourou device-manager/engine:exists <index>
```
---

## Response

Returns an object containing an `exists` property.

```js
{
  "requestId": "d16d5e8c-464a-4589-938f-fd84f46080b9",
  "status": 200,
  "error": null,
  "controller": "device-manager/engine",
  "action": "exists",
  "collection": null,
  "index": "tenant-ayse",
  "result": { 
    "exists": true
  }
}
```
