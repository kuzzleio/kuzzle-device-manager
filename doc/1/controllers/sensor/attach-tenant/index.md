---
code: true
type: page
title: attachTenant
description: Attach a sensor to a tenant index
---

# attachTenant

Attach a sensor to a tenant.

The sensor document will be duplicated inside the tenant "sensors" collection.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/sensors/_:id/_assign[?refresh=wait_for]
Method: PUT
```

### Other protocols

```js
{
  "index": "<index>",
  "controller": "device-manager/sensor",
  "action": "attachTenant",
  "_id": "<sensorId>"
}
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
  "controller": "device-manager/sensor",
  "action": "attachTenant",
  "requestId": "<unique request identifier>",
  "result": {}
}
```
