---
code: true
type: page
title: attachTenant
description: Attach a device to a tenant index
---

# attachTenant

Attach a device to a tenant.

The device document will be duplicated inside the tenant `devices` collection.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/devices/:_id/_attach[?refresh=wait_for]
Method: PUT
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/device",
  "action": "attachTenant",
  "_id": "<deviceId>"
}
```

### Kourou

```bash
kourou device-manager/device:attachTenant <index> --id <deviceId>
```
---

## Arguments

- `index`: Tenant index name

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the documents are indexed

---

## Response

```js
{
  "status": 200,
  "error": null,
  "index": "<index>",
  "controller": "device-manager/device",
  "action": "attachTenant",
  "requestId": "<unique request identifier>",
  "result": {}
}
```
