---
code: true
type: page
title: listGroups
description: Lists group models
---

# listGroups

Lists group models.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/groups
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "listGroups",
  "tenantClasses": ["<tenant class>"]
}
```

---

## Arguments

- `tenantClasses`: names of the tenant classes

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "listGroups",
  "requestId": "<unique request identifier>",
  "result": {
    "models": [
      {
        "_id": "<modelId>",
        "_source": {
          // Group model content
        },
      }
    ],
    "total": 42
  }
}
```
