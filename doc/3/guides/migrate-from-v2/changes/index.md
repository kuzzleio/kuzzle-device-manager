---
code: false
type: page
order: 100
title: Breaking changes
description: List of breaking changes
---

# Breaking changes

**Table of Contents**
- [Settings](#Settings)
  - Platform index
  - Platform collections
- [Mappings](#mappings)
  - Asset
  - Device
  - Group Model
- [API](#api)
  - device-manager/assetGroups
  - device-manager/devices
  - device-manager/devices:unlinkAsset
  - device-manager/assets

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