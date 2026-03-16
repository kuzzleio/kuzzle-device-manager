---
code: false
type: page
order: 100
title: Breaking changes
description: List of breaking changes
---

# Breaking changes

**Table of Contents**
- [Settings](#settings)
  - Platform index
  - Platform collections
- [Mappings](#mappings)
  - Asset
  - Device
  - Group Model
  - Models (platform collection)
- [API](#api)
  - device-manager/assetGroups
  - device-manager/devices
  - device-manager/devices:unlinkAsset
  - device-manager/assets
  - device-manager/models (scoping changes)

## Settings


### Platform index

The setting parameter of the Device manager plugin `adminIndex` has been renamed `platformIndex`. 

### Platform collections

The setting parameter of the Device manager plugin `adminCollections` has been renamed `platformCollections`.


## Mappings


### Assets

The ingested measures are no longer propagated to the relevent asset.

The following property have been removed from the `assets` collection mappings:
  - `measures`
  - `lastMeasuredAt`

The property `linkedDevices` has been renamed `linkedMeasures` and its mappings are as follow:

``` JSON
{
  "properties":{
    "deviceId": { "type": "keyword" },
    "measureSlots": {
      "properties": {
        "asset" { "type": "keyword" },
        "device": { "type": "keyword" },
      }
    }
  }
}
```

The property `groups` mappings are  as follow:

``` JSON
{
  "properties":{
    "date": { "type": "date" },
    "path": { "type": "keyword" },
  }
}
```

### Devices

#### Tenant collection

The ingested measures are no longer propagated to the relevent device.

A device can link measures with several assets.

A device can be added to a group.

The following property have been removed from the `devices` collection mappings:
  - `measures`
  - `lastMeasuredAt`
  - `assetId`

A new property`linkedMeasures` has been added and its mappings are as follow:

``` JSON
{
  "properties":{
    "assetId": { "type": "keyword" },
    "measureSlots": {
      "properties": {
        "asset" { "type": "keyword" },
        "device": { "type": "keyword" },
      }
    }
  }
}
```


A new property `groups` has been added and its mappings are as follow:

``` JSON
{
  "properties":{
    "date": { "type": "date" },
    "path": { "type": "keyword" },
  }
}
```
##### Platform collection

The platform collection `devices` has no longer the same mappings as the one of the tenant indices. It serves to track the provisioning and attachement of a device to a tenant. If a device is provisionned but not attached to a tenant and receives measures the last 5 measures will be kept in its `lastMeasures` property.

The following properties are removed from the  mappings:
  - `measures`
  - `assetId`
  - `metadata`

A new property `lastMeasures` has been added and its mappings are as follow:

``` JSON
{
  "properties":{
    "values": { /* measure values */ },
    "measuredAt": { "type": "date" },
    "type": { "type": "keyword" },
    "measurename": { "type": "keyword" },
  }
}
```
### Group model
The group model documents in the platform index `models` collection must contain an `affinity`:
``` JSON
{
  "properties":{
    "group": { /* other properties*/
      "affinity":{
        "properties":{
          "type":{ "type": "keyword" },
          "models":{
            "properties":{
              "assets":{ "type": "keyword" },
              "devices":{ "type": "keyword" }
            },
          "strict":{ "type": "boolean" }
          }
        }
      }
     },
  }
}
```

### Models (platform collection)

The `models` collection in the platform index has two new fields for scoping:

``` JSON
{
  "properties": {
    "engineGroups": { "type": "keyword" },
    "engineIds": { "type": "keyword" }
  }
}
```

- `engineGroups` (replaces former `engineGroup`): An array of tenant group names. Determines which tenant groups can access the model. The value `["commons"]` makes the model globally available.
- `engineIds` (optional): An array of tenant engine IDs. When present, scopes the model to specific tenants within the `engineGroups`.

These fields affect asset, measure, and group model documents. All three model types support multi-group scoping via `engineGroups`.

#### Model document ID format

Asset model document IDs now vary based on scope:

| Scope | Format | Example |
|-------|--------|---------|
| Single group | `model-asset-{ModelName}` | `model-asset-Room` |
| Multi-group | `model-asset-{sortedGroups}-{ModelName}` | `model-asset-air_quality+public_lighting-Sensor` |
| Tenant-scoped | `model-asset-{sortedGroups}-{sortedEngineIds}-{ModelName}` | `model-asset-air_quality-engine-ayse-TenantSensor` |

Measure model document IDs:

| Scope | Format | Example |
|-------|--------|---------|
| Global | `model-measure-{type}` | `model-measure-temperature` |
| Multi-group | `model-measure-{sortedGroups}-{type}` | `model-measure-air_quality+public_lighting-temperature` |
| Tenant-scoped | `model-measure-{sortedGroups}-{sortedEngineIds}-{type}` | `model-measure-air_quality-engine-ayse-temperature` |
| Tenant-scoped (no groups) | `model-measure-{sortedEngineIds}-{type}` | `model-measure-engine-ayse-temperature` |

Group model document IDs:

| Scope | Format | Example |
|-------|--------|---------|
| Single group | `model-group-{ModelName}` | `model-group-TruckFleet` |
| Multi-group | `model-group-{sortedGroups}-{ModelName}` | `model-group-air_quality+public_lighting-TruckFleet` |

## Api

### device-manager/assetGroups

Groups can now contain assets and devices.

The `device-manager/assetGroups` has been renamed `device-manager/groups`.

For more consistancy the controller actions `addAsset` and `removeAsset` have been renamed `addAssets` and `removeAssets`.

### device-manager/devices

The `device-manager/devices` action `linkAsset` and `unlinkAsset` have been renamed `linkAssets` and `unlinkAssets`.

#### linkAsset

The `linkAssets` requires the following arguments:

##### Arguments

- `engineId`: Engine ID
- `_id`: Device ID

##### Body properties

- `linkedMeasures`: Array containing the link to establish, one per asset.
              - `assetId`: The id of the asset to link,
              - `implicitMeasuresLinking`: Boolean to link all linkable measures. (optional)
              - `measureSlots` An array containing a corresponding table between device measure name and asset measure name. (optional)

#### unlinkAssets

The `unlinkAssets` requires the following arguments:

##### Arguments

- `engineId`: Engine ID
- `_id`: Device ID

##### Body properties

- `linkedMeasures`: Array containing the link to establish, one per asset.
              - `assetId`: The id of the asset to unlink,
              - `allMeasures`: Boolean to unlink all linked measures. (optional)
              - `measureSlots` An array containing a corresponding table between device measure name and asset measure name. (optional)


### device-manager/assets

The `device-manager/assets` action `migrateTenant` now accepts a new argument `includeDevices` set to false by default.

The devices are no longer systematically migrated with the asset. 

If set to true, the devices linked to the asset will be unlinked from their potential other assets and migrated to the new tenant.

### device-manager/models

#### Scoping parameters renamed

The following parameter changes apply to all asset and group model operations (`writeAsset`, `updateAsset`, `getAsset`, `listAssets`, `searchAssets`, `writeGroup`, `listGroups`, `searchGroups`):

- `engineGroup` (string) has been replaced by `engineGroups` (string array). This enables sharing an asset model across multiple tenant groups.
- `engineIds` (string array, optional) has been added to `writeAsset` and `updateAsset` body. When provided, the model is scoped to specific tenant engines within the specified groups.

#### Asset model scoping — 3-level fallback

Asset models now support three scoping levels. When resolving a model with `getAsset`, the system follows a priority chain:

1. **Tenant-scoped**: Model matching both the `engineGroups` and the specific `engineId`
2. **Group-scoped**: Model matching the `engineGroups` but without `engineIds`
3. **Global (commons)**: Model with `engineGroups: ["commons"]` and no `engineIds`

Anti-shadowing enforcement: a model name (for assets) or measure type (for measures) cannot exist at different scope levels simultaneously. For example, creating a tenant-scoped model when a global model with the same name already exists is rejected. This prevents accidental shadowing of global models by local ones.

`listAssets` and `searchAssets` accept an optional `engineId` parameter. When provided, they return tenant-scoped + group-scoped + commons models. When omitted, they return only group-scoped + commons models.

#### Multi-group models

Asset, group, and measure models can belong to multiple tenant groups (e.g. `engineGroups: ["air_quality", "public_lighting"]`). A model listed with any of its groups will include it in results.

Commons normalization applies to all model types: if `engineGroups` contains `"commons"`, the array is normalized to `["commons"]` (the model becomes global).

#### Measure model scoping

Measure models now accept the same scoping parameters as asset models:

- `writeMeasure` accepts optional `engineGroups` (string array) and `engineIds` (string array) body parameters.
- `getMeasure`, `listMeasures`, and `searchMeasures` accept an optional `engineId` query parameter.

When `engineId` is provided, `getMeasure` returns the tenant-scoped measure first, falling back to the global one. When omitted, only global measures are returned (backward compatible).

Anti-shadowing applies to measures as well: a measure type cannot exist at different scope levels (global vs group-scoped vs tenant-scoped).