---
code: false
type: page
title: Multi Tenancy
description: Multi Tenancy workflow
order: 400
---

# Multi Tenancy

The plugin is designed to work with several tenants, each with their own sensors and assets.

Each tenant has its own index with the required collections.

It is possible to manage its holders with the [device-manager/engine](/kuzzle-iot-platform/device-manager/1/controllers/engine) controller.

::: info
When used with the multi-tenant plugin, the collections needed by the device-manager are automatically created when creating a new tenant with the multi-tenant plugin.
:::

### Sensors

The list of available sensors is stored in the sensors collection of the administration index (device-manager).

When assigning the sensor to a tenant, the `tenantId` property is updated and the sensor is copied to the `sensors` collection of the tenant's index.