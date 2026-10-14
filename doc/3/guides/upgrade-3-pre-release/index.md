---
code: false
type: page
order: 800
title: Upgrade a 3 pre-release
description: Upgrade an installation that ran a Device Manager 3 pre-release
---

# Upgrade a Device Manager 3 pre-release

The 3-dev line renamed fields that are stored in your data, without compatibility. An installation that ran an earlier 3 pre-release has to be upgraded once, with the `migrate-device-manager` script.

Applications upgrading from Device Manager 2 follow the [v2 migration guide](/kuzzle-device-manager/3/guides/migrate-from-v2) instead.

## What changed

### The tenant is the request index (`engineId` → `index`)

Kuzzle only confines a profile to a tenant through the request `index`: the actions now take the tenant as `index`.

| Before | After | Data migration |
|---|---|---|
| `engineId` argument of every action | `index` (HTTP routes unchanged: `device-manager/:index/...`) | — |
| `newEngineId` argument of `assets:migrateTenant` | `newIndex` | — |
| `engineIds` field of tenant-scoped asset and measure models | `indexes` | Automatic, at startup |
| `engineId` field of the device documents (platform index and tenants) | `index` | **The script** |

Requests still sending `engineId` are refused with `Missing argument "index"`. A cross-tenant call made on behalf of a tenant user is now refused by Kuzzle: run it with the application SDK.

### The class of a tenant (`engineGroups` → `tenantClasses`)

| Before | After | Data migration |
|---|---|---|
| `engineGroups` field of the model documents | `tenantClasses` | **The script** |
| `engineGroups` argument of the `device-manager/models` actions | `tenantClasses` | — |
| `registerAsset(engineGroups, ...)`, `registerGroup(engineGroups, ...)` | Same positional argument, renamed `tenantClasses` | — |
| `engineGroups` of the API measure targets | `tenantClasses` | — |
| `group` payload of `ask:device-manager:engine:list` | `tenantClass` | — |
| `engineGroups` payload of `ask:device-manager:model:asset:get` | `tenantClasses` | — |

The value `"commons"` (every class) is unchanged, and so are the model document IDs. The engine documents and the `device-manager/engine:create` and `device-manager/engine:update` actions still name the tenant class `group`: they belong to `kuzzle-plugin-commons`, which multi-tenancy relies on.

## Procedure

1. **Back up the platform index** (`device-manager` by default) and the tenant indexes:

   ```bash
   kourou index:export device-manager
   ```

2. **Update your code** for the renamed arguments and payloads listed above.

3. **Upgrade** the `kuzzle-device-manager` dependency and restart Kuzzle. At startup, the plugin adds the new fields to the platform mappings and moves `engineIds` to `indexes` on the models. Until the next step, the devices attached before the upgrade are seen as unattached: their measures are not routed to their tenant, and the models created through the API are not taken into account by the tenants. Run the next step right away, and do not attach, detach or create anything in between.

4. **Run the upgrade script** with an administrator account:

   ```bash
   npx migrate-device-manager --host=localhost --port=7512 --username=admin --password=<password> --dry-run
   npx migrate-device-manager --host=localhost --port=7512 --username=admin --password=<password>
   ```

   The script:
   - refuses to run if the platform mappings have no `tenantClasses` or `index` field yet (step 3 not done);
   - moves `engineGroups` to `tenantClasses` on every model document, and removes `engineGroups`. When a model already has `tenantClasses` (models registered by the application at startup), that value is kept;
   - calls `device-manager/engine:update` on every engine, so the tenant collections get the mappings of the migrated models and the new `index` field of the devices;
   - moves `engineId` to `index` on the device documents of the platform index and of every tenant, and empties `engineId`. This is a partial update, so the measures ingested meanwhile are kept;
   - checks that no model still has `engineGroups` and no device only has `engineId`.

   It can be run again: it then only updates the engines.

| Option | Environment variable | Default |
|---|---|---|
| `--host` | `KUZZLE_HOST` | `localhost` |
| `--port` | `KUZZLE_PORT` | `7512` |
| `--protocol` (`websocket` or `http`) | `KUZZLE_PROTOCOL` | `websocket` |
| `--ssl` | `KUZZLE_SSL=true` | off |
| `--username`, `--password` | `KUZZLE_USERNAME`, `KUZZLE_PASSWORD` | anonymous |
| `--platform-index` | `PLATFORM_INDEX` | `device-manager` |
| `--dry-run` | | off: lists the changes without writing |

The former fields (`engineGroups`, `engineIds`, `engineId`) stay in the mappings of the existing installations, because Elasticsearch cannot remove a field from a mapping. Nothing reads or writes them anymore.
