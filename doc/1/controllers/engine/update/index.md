---
type: page
code: true
title: update
description: Updates a device manager engine on an index
---

# update


Updates a new device manager engine on an index

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/engine/:index/[?group]
Method: PUT
```

### Other protocols

```js
{
  "controller": "device-manager/engine",
  "action": "update",
  "index": "tenant-ayse",

  // Optional
  "group": "tenant-group"
}
```

### Kourou

```bash
kourou device-manager/engine:update <index> -a group=<tenant group>
```
---

## Response

Returns an object containing the index name and the list of updated collections with their mappings.

```js
{
  "requestId": "d16d5e8c-464a-4589-938f-fd84f46080b9",
  "status": 200,
  "error": null,
  "controller": "device-manager/engine",
  "action": "update",
  "collection": null,
  "index": null,
  "result": { 
    "index": "tenant-ayse",
    "collections": {
      "assets": {
        "properties": {
          // Mappings properties
        }
      },
      // other collections are returned as well
    }
  }
}
```
