---
code: false
type: page
order: 800
title: Rename engineGroups to tenantClasses
description: Upgrade a Device Manager 3 pre-release where models still use engineGroups
---

# Rename `engineGroups` to `tenantClasses`

The field that scopes asset, group and measure models to a class of tenants (`asset_tracking`, `air_quality`, ...) was named `engineGroups`. It is now named `tenantClasses`, everywhere and without compatibility:

| Before | After |
|---|---|
| `engineGroups` field of the model documents | `tenantClasses` |
| `engineGroups` argument of the `device-manager/models` actions | `tenantClasses` |
| `registerAsset(engineGroups, ...)`, `registerGroup(engineGroups, ...)` | Same positional argument, renamed `tenantClasses` |
| `engineGroups` of the API measure targets | `tenantClasses` |
| `group` payload of `ask:device-manager:engine:list` | `tenantClass` |
| `engineGroups` payload of `ask:device-manager:model:asset:get` | `tenantClasses` |

The value `"commons"` (every class) is unchanged, and so are the model document IDs.

The engine documents and the `device-manager/engine:create` and `device-manager/engine:update` actions still name the tenant class `group`: they belong to `kuzzle-plugin-commons`, which multi-tenancy relies on.

## Who needs it

Only the applications that ran a Device Manager 3 pre-release whose models still have an `engineGroups` field. Applications upgrading from Device Manager 2 follow the [v2 migration guide](/kuzzle-device-manager/3/guides/migrate-from-v2) instead.

## Procedure

1. **Back up the platform index** (`device-manager` by default):

   ```bash
   kourou index:export device-manager
   ```

2. **Update your code**: rename `engineGroups` to `tenantClasses` in your API calls (`device-manager/models` actions, measure targets) and in the `ask:device-manager:*` payloads listed above.

3. **Upgrade** the `kuzzle-device-manager` dependency and restart Kuzzle. At startup, the plugin adds `tenantClasses` to the `models` collection mappings. Until the next step, the models created through the API are not taken into account by the tenants: do not create assets or models in between.

4. **Run the upgrade script** with an administrator account. The binary is named `migrate-model-tenant-classes` so that it does not collide with the `migrate-tenant-classes` binary of multi-tenancy, which the applications using both plugins also run:

   ```bash
   npx migrate-model-tenant-classes --host=localhost --port=7512 --username=admin --password=<password> --dry-run
   npx migrate-model-tenant-classes --host=localhost --port=7512 --username=admin --password=<password>
   ```

   The script:
   - refuses to run if the `models` collection has no `tenantClasses` field (step 3 not done);
   - moves `engineGroups` to `tenantClasses` on every model document, and removes `engineGroups`. When a model already has `tenantClasses` (models registered by the application at startup), that value is kept;
   - checks that no model still has `engineGroups`;
   - calls `device-manager/engine:update` on every engine, so the tenant collections get the mappings of the migrated models.

   It is idempotent: running it again only updates the engines.

| Option | Environment variable | Default |
|---|---|---|
| `--host` | `KUZZLE_HOST` | `localhost` |
| `--port` | `KUZZLE_PORT` | `7512` |
| `--protocol` (`websocket` or `http`) | `KUZZLE_PROTOCOL` | `websocket` |
| `--ssl` | `KUZZLE_SSL=true` | off |
| `--username`, `--password` | `KUZZLE_USERNAME`, `KUZZLE_PASSWORD` | anonymous |
| `--platform-index` | `PLATFORM_INDEX` | `device-manager` |
| `--dry-run` | | off: lists the changes without writing |
| `--skip-engines` | | off: does not update the engines |

The `engineGroups` field stays in the `models` collection mappings of the existing installations, because Elasticsearch cannot remove a field from a mapping. Nothing reads or writes it anymore.
