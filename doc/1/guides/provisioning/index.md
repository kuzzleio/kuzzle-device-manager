---
code: false
type: page
title: Provisioning
description: Provisioning catalog
order: 600
---

# Provisioning

## Provisioning Policy

The plugin offer two policies for registering devices when receiving a new payload:
  - auto provisioning: automatically register the device
  - provisioning catalog: only register authorized device

This can be changed by modifying the plugin config document in the `config` collection of the administration index:

::: info
The document ID is `plugin--device-manager`.
::: 

```js
{
  "type": "device-manager",
  "device-manager": {
    "provisioningStrategy": 'auto' | 'catalog'
  }
}
```

## Provisioning Catalog

Administrator can create catalog entries to allows devices to register.  

Those entries must be created in the `config` collection of the administration index.  
Each entry must contain at least the `deviceId` property (e.g. `Abeeway-12345`).  

```js
{
  "type": "catalog",
  "catalog": {
    "deviceId": "Abeeway-12345",
    "authorized": true,
  }
}
```

If the `authorized` property is set to `false`, then the device will not be allowed to register.

::: warning
If `autoProvisioning` is set to `false` in the config document, the plugin will only register devices listed in the provisioning catalog.
:::

### Automatically attach tenant

A provisioning catalog entry can also contain a `tenantId` property so the device will be automatically attached to a tenant after registration.

```js
{
  "type": "catalog",
  "catalog": {
    "deviceId": "Abeeway-12345",
    "authorized": true,
    "tenantId": "tenant-shipment-kuzzle", // Automatically attach the device to this tenant
  }
}
```

### Automatically link asset

A provisioning catalog entry can also contain a `assetId` property so the device will be automatically linked to an asset after registration. This property must contain the unique identifier of an asset present in the tenant index.

```js
{
  "type": "catalog",
  "catalog": {
    "deviceId": "Abeeway-12345",
    "authorized": true,
    "tenantId": "tenant-shipment-kuzzle",
    "assetId": "container--xlarger-47GD2", // Automatically link the device to this asset
  }
}
```

