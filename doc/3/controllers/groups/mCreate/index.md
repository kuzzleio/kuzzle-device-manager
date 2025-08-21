---
code: true
type: page
title: mcreate
description: Creates several groups
---

# mCreate

Creates multiple groups.

This endpoint allows you to create several new groups in the Device Manager.  
You must specify for each group a name, and optionally a model, metadata, and an ancestry path.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/groups/_mCreate
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/groups",
  "action": "mCreate",
  "engineId": "<engineId>",
  "body": {
    "groups":[
      {
      "name": "<group name>",
      "_id": "<group id>",                          // optional (generated if not provided)
      "model": "<group model>",                     // optional
      "metadata": { ... },                          // optional
      "path": "<direct parent group path>"          // optional
      }
    ]

  }
}
```

---

## Arguments

- `engineId`: Engine ID (required)

## Body properties
- `groups`: Array containing the different groups to create.
    - `name`: Name of the group (required, must be unique)
    - `_id`: Id of the group (optional, must be unique, generated if not provided)
    - `model`: Group model name (optional)
    - `metadata`: Object containing group metadata (optional)
    - `path`: Ancestry path for the group (optional, defaults to group ID)

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/groups",
  "action": "create",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<groupId>",
    "_source": {
      "successes":/*  
          Array<{
          "_id": "string";
          "_source": "<GroupContent>";
          "created": "boolean";
              }>; 
        */,
      "errors":/*  
          Array<{
            document: {
              _id: string;
              body: JSONObject;
            };
            status: number;
            reason: string;
              }>;
        */
    }
  }
}
```

---

## Errors

- Returns an error if the group name is missing or already exists.
- Returns an error if the _id already exists.
- Returns an error if the path is invalid or the parent group does not exist.
