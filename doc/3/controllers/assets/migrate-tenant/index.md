---
code: true
type: page
title: migrateTenant
description: Migrates a list of assets and their attached devices to another tenant
---

# update

This action allow to migrates a list of assets and their attached devices to another tenant.


## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/_migrateTenant
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "migrateTenant",
  "engineId": "<engineId>",
  "body": {
    "assetsList": ["<assetId>"],
    "newEngineId": "<newEngineId>"
  }
}
```

---

## Arguments

- `engineId`: Engine ID

## Body properties

- `assetsList`: An array containing a list of asset ids to migrate
- `newEngineId`: The id of the engine you want to migrate the assets to

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "migrateTenant",
  "requestId": "<unique request identifier>",
}
```
