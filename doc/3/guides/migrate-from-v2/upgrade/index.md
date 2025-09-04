---
code: false
type: page
order: 100
title: Migration guide
description: Migration guide from Device Manager 2.x to 3.x
---

# Migration Guide: Kuzzle Device Manager v2 to v3

To help migrate your data from Kuzzle Device Manager 2.x to 3.x we made 2 scripts available, one for the platform index and one for the tenant indices. Those scripts will convert the data of every collection to fit the new mappings and data models.

This guide outlines the steps to migrate your data using those scripts.

The migration follows 3 global steps: 
    1- Export your indices
    2- Transform your dumped data
    3- Import your updated dumped data into a new instance.


You will need to have the cli `kourou` installed. You can refer to its documentation here [Kourou](https://github.com/kuzzleio/kourou)

## 1. Export Data

First, you need to export your existing platform and engine indices. Use the kourou [index:export](https://github.com/kuzzleio/kourou#kourou-indexexport-index) command for this. Replace INDEX with the name of the index you are exporting.

```Bash
kourou index:export INDEX
```

## 2. Run Migration Scripts

The Kuzzle Device Manager v3 ships migrating scripts to help in the migration of your data.

::: warning
The scripts will rewrite your dump data to fit the new data models, you can make a copy of your original data if you don't want to lose it.
:::

### Upgrade your device manager version

Upgrade the version of your`kuzzle-device-manager` dependency to `^3.0.0` and run `npm i`


### Platform Index:

Run the migrate-platform script on your platform index dump.

``` bash

npx migrate:platform --platform-index=path/to/platform/index/dump
```

### Engine Indices:

For each engine index dump, run the migrate-tenant script. 

::: info
Add the `--with-soft-tenants` if you're using the plugin multi-tenancy along with Kuzzle Device Manager.
:::

```bash

npx migrate-tenant --platform-index=path/to/platform/index/dump --tenant-index=path/to/engine/index/dump --with-soft-tenants
```

## 3. Start up a new instance

Start your application with new empty elasticsearch volumes.

## 4. Import Platform Index

Import the updated platform index dump into your new instance using the kourou index:import command.

::: warning
The `--no-mappings` flag is necessary to avoid conflicts between the former and new mappings.
:::

```bash
kourou index:import PATH --no-mappings
```

## 5. Restart and Recreate Engine Indices

Restart the new Kuzzle instance. The missing engine indices will be created automatically. 

::: info
If you're using the `muti-tenancy` plugin alongside the device manager you should run the action `multi-tenancy/tenant:updateAll` to recreate missing tenants and collections.
:::


## 6. Import Engine Indices

Finally, for each engine, import the updated dump.

::: warning
The `--no-mappings` flag is necessary to avoid conflicts between the former and new mappings.
:::

```bash
kourou index:import PATH --no-mappings
```

By following these steps, you should be able to successfully migrate your data from Kuzzle Device Manager v2 to v3.
