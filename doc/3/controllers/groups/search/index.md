---
code: true
type: page
title: search
description: Search for groups
---

# Search

Searches for groups.

This endpoint allows you to search for groups using a query, sort, and pagination options.  
You can filter groups by name, model, path, metadata, or any indexed property.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/groups/_search
Method: GET or POST
```

### Other protocols

```js
{
  "controller": "device-manager/groups",
  "action": "search",
  "engineId": "<engineId>",
  "body": {
    "query": { /* Koncorde query */ }, // optional
    "sort": [ /* sort fields */ ],     // optional
    "from": <offset>,                  // optional
    "size": <limit>                    // optional
  }
}
```

---

## Arguments

- `engineId`: Engine ID (required)

## Body properties

- `query`: Search query in Koncorde syntax (optional)
- `sort`: Array of sort fields (optional)
- `from`: Offset for pagination (optional)
- `size`: Limit for pagination (optional)

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/groups",
  "action": "search",
  "requestId": "<unique request identifier>",
  "result": {
    "total": <number of matching groups>,
    "hits": [
      {
        "_id": "<groupId>",
        "_source": {
          "name": "<group name>",
          "model": "<group model>",
          "metadata": { ... },
          "path": "<group path>",
          // other group properties
        }
      },
      // ...
    ]
  }
}
```

---

## Errors

- Returns an error if the query syntax is invalid.