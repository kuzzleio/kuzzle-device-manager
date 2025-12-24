---
code: true
type: page
title: list
description: List registered decoders
---

# list

List registered decoders.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/decoders
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/decoders",
  "action": "list",
}
```

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/decoders",
  "action": "list",
  "requestId": "<unique request identifier>",
  "result": {
    "decoders":[
      {
        "action":"AdeunisComfort",
        "deviceModel":"AdeunisComfortCo2",
        "measures":[
          {
            "name":"environmentalQuality",
            "type":"environmentalQuality"
          }
        ]
      },
      {
        ...
      }
    ]
  }
}
```
