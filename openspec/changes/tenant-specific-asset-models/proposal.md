# Tenant-Specific Asset Models

## Why

Asset models are currently scoped to tenant groups only. Tenants within the same group all share the same asset models, making it impossible to customize models for a specific tenant without impacting others. This forces platform admins to either create a new tenant group for every customization, or accept model uniformity across tenants.

## What Changes

- Add an optional `engineId` field to `AssetModelContent`, allowing asset models to be scoped to individual tenants
- Update `writeAsset` to accept an optional `engineId` parameter
- Update `listAssets`/`searchAssets`/`getAsset` to implement the fallback chain: **tenant → tenant group → commons**
- Update model ID format to distinguish same-name models at different scopes
- Add type checks and functional tests covering tenant-specific model creation, retrieval, and fallback behavior

## Capabilities

### New Capabilities

- `tenant-scoped-asset-model`: Write asset models scoped to a specific tenant (engine)
- `tenant-fallback-chain`: List/search/get resolves models with tenant → tenant group → commons precedence

### Modified Capabilities

- `asset-model-write`: Now accepts optional `engineId`
- `asset-model-list-search`: Now filters with 3-level fallback instead of 2-level

## Impact

- `lib/modules/model/types/ModelContent.ts`: Add optional `engineId` to `AssetModelContent`
- `lib/modules/model/ModelService.ts`: Update write/list/search/get logic
- `lib/modules/model/ModelsController.ts`: Accept `engineId` parameter
- `lib/modules/model/collections/modelsMappings.ts`: Add `engineId` mapping
- `lib/modules/model/ModelSerializer.ts`: Update ID generation for tenant-scoped models
- `tests/scenario/modules/models/asset-model.test.ts`: New functional tests for tenant scoping
- Type checks via `tsc --noEmit` to validate all type changes compile cleanly
