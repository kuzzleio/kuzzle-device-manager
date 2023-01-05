---
type: page
code: true
title: create
description: Creates a new Device Manager engine on an index
---

# create


Creates a new device manager engine on an index

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/engine/:index/[?group]
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/engine",
  "action": "create",
  "index": "engine-ayse",

  // Optional
  "group": "tenant-group"

}
```

### Kourou

```bash
kourou device-manager/engine:create <index> -a group=<tenant group>
```
---

## Response

Returns an object containing the index name and the list of created collections with their mappings.

```js
{
  "requestId": "d16d5e8c-464a-4589-938f-fd84f46080b9",
  "status": 200,
  "error": null,
  "controller": "device-manager/engine",
  "action": "create",
  "collection": null,
  "index": null,
  "result": {
    "index": "engine-ayse",
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
