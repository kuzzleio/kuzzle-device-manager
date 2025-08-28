---
code: false
type: page
order: 100
title: Migration guide
description: Migration guide from Device Managetr 2.x to 3.x
---

# Migration Guide: Kuzzle Device Manager v2 to v3

This guide outlines the steps to migrate your Kuzzle Device Manager from version 2 to version 3.

You need to have the cli `kourou` installed. You can refere to its documentation here [Kourou](https://github.com/kuzzleio/kourou)

## 1. Export Data

First, you need to export your existing platform and engine indices. Use the kourou index:export command for this. Replace INDEX with the name of the index you are exporting.

```Bash
kourou index:export INDEX
```

## 2. Run Migration Scripts

The Kuzzle Device Manager v3 ships migrating scripts to help in the migration of your data.

### Upgrade your device manager version

Upgrade the version of your`kuzzle-device-manager` dependency to `^3.0.0` and run 

``` bash
npm i
```


### Add Scripts to package.json

Assuming the migration scripts are located in node_modules/kuzzle-device-manager/migration/, you can add the following entries to your package.json:

```JSON
{
    "migrate:platform": "node node_modules/kuzzle-device-manager/migration/migration_platform_index.js",
    "migrate:tenant": "node node_modules/kuzzle-device-manager/migration/migration_tenant_index.js"
}
```
If you're using the multi-tenancy plugin along the device manager you should add the following environment variable to the `migrate:tenant` script : `WITH_SOFT_TENANTS=true`

You would then have package.json looking like this:

``` JSON

{
"name": "my-project",
"version": "1.0.0",
"scripts": {
"migrate:platform": "node node_modules/kuzzle-device-manager/migration/migration_platform_index.js",
"migrate:tenant": "node node_modules/kuzzle-device-manager/migration/migration_tenant_index.js",
"test": "echo \"Error: no test specified\" && exit 1"
},
"dependencies": {
"kuzzle-device-manager": "^3.0.0"
}
}
```

Next, you will run migration scripts on the exported data.

### Platform Index:

Run the migrate:platform script on your platform index dump.

``` bash

PLATFORM_INDEX=path/to/platform/index/dump npm run migrate:platform
```

### Engine Indices:

For each engine index dump, run the migrate:tenant script.

```bash

TENANT_INDEX=path/to/engine/index/dump npm run migrate:tenant
```

## 3. Start up a new instance

Start your application with new empty elasticsearch volumes.

## 4. Import Platform Index

Import the updated platform index dump into your new instance using the kourou index:import command.

```bash
kourou index:import PATH
```

## 5. Restart and Recreate Engine Indices

Restart the new Kuzzle instance. The missing engine indices will be created automatically.

## 6. Import Engine Indices

Finally, for each engine, import the updated dump.

```bash
kourou index:import PATH
```

By following these steps, you should be able to successfully migrate your Kuzzle Device Manager from v2 to v3.
