---
code: true
type: page
title: mupdate
description: Updates several groups
---

# mUpdate

Updates multiple groups.

This endpoint allows you to update several groups.  

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/groups/_mUpdate_
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/groups",
  "action": "mUpdate",
  "engineId": "<engineId>",
  "body": {
    "groups":[
      {
      "_id": "<group id>",                          
      "name": "<group name>",                       // optional
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
- `groups`: Array containing the different groups to update.
    - `_id`: Id of the group (required)
    - `name`: Name of the group (optional, must be unique)
    - `model`: Group model name (optional)
    - `metadata`: Object containing group metadata (optional)
    - `path`: Ancestry path for the group (optional)

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
- Returns an error if the path is invalid or the parent group does not exist.
