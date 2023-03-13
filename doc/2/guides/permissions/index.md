---
code: false
type: page
title: Permissions
description: Default available permissions
---

# Permissions

Each Device Manager module exposes specific roles to actions possible via the API.

These roles can then be composed into profiles to define a user's permissions.

## Devices permissions

These roles give access to the APIs concerning the devices with in particular actions on the `device-manager/devices` and `device-manager/models` controllers.

Roles are defined hierarchically, permissions from previous roles are included in the following role:

1. `devices.reader`: allows to list the devices and their measures as well as the models of devices and measures
2. `devices.admin`: allows creating, modifying, deleting and linking devices as well as creating/deleting device templates
3. `devices.platform-admin`: allows to assign devices to a tenant

The `devices.reader` and `devices.admin` roles are for tenant users while the `devices.platform-admin` role is for IoT platform administrators.

## Assets permissions

These roles give access to the APIs concerning the assets with in particular actions on the `device-manager/assets` and `device-manager/models` controllers.

Roles are defined hierarchically, permissions from previous roles are included in the following role:

1. `assets.reader`: allows to list the assets and their measures as well as the models of assets and measures
2. `assets.admin`: allows to create, modify and delete assets as well as create/delete asset templates

These roles are intended for users of a tenant.

## Permission measures

These roles give access to the APIs concerning the measurements with in particular actions on the `device-manager/models` controller.

Roles are defined hierarchically, permissions from previous roles are included in the following role:

1. `measures.reader`: allows to list the measurement models
2. `measures.admin`: used to create, modify and delete measurement templates

These roles are intended for users of a tenant.

## Payloads permissions

These roles give access to the data ingestion APIs through the `device-manager/payloads` and `device-manager/decoders` controllers.

- `payloads.all`: allows to ingest raw data on all Decoders
- `decoders.admin`: allows to list available Decoders
