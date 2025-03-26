---
code: true
type: page
title: get
description: Gets an raw payload by uuid
---

# get

Gets a raw payload by UUID.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/raw-payloads/:_id
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/rawPayloads",
  "action": "get",
  "_id": "<payloadUUID>"
}
```

---

## Arguments

- `_id`: payload uuid

---

## Response

```js
{
  "action": "get",
  "controller": "device-manager/rawPayloads",
  "error": null,
  "node": "nodeId",
  "requestId": "<requestId>",
  "result": {
    "_id": "<payloadUUID>",
    "_source": {
      "apiAction": "<payloadEndpoint>",
      "deviceModel": "<deviceModelName>",
      "payload": {
        // payload content
      },
      "state": "VALID",
      "uuid": "<payloadUUID>",
      "valid": true,
      "_kuzzle_info": {
        // kuzzle information
      }  
    },
    "_version": "<version>"" 
  },
  "status": 200,
  "volatile": {
    "sdkInstanceId": "<sdkInstanceId>",
    "sdkName": "<sdkNameVersion>"
  }
  "room": "<roomId>"
}
```
