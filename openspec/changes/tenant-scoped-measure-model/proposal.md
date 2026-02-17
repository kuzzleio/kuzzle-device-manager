## Why

Measure models are currently global — they have no tenant scoping. A user who creates a tenant-scoped asset model needs to define custom measure types for that asset, but doing so affects all tenants and global models. There is no way to create a measure model that is private to a specific tenant without impacting others.

## What Changes

- Add an optional `engines` field to `MeasureModelContent`, allowing measure models to be scoped to specific tenants
- Update `writeMeasure` to accept an optional `engines` parameter
- Update `listMeasures`/`searchMeasures` to support the 2-level fallback chain: **tenant → global**
- Update `getMeasure` to resolve with tenant priority when `engineId` is provided
- Update measure model ID format to distinguish same-type measures at different scopes (e.g., `model-measure-temperature` vs `model-measure-engine-ayse-temperature`)
- Update `modelsMappings` to add `engines` field to the measure model mappings
- Mapping conflict check: tenant-scoped measures must be consistent with global measures, but not with measures scoped to other tenants
- Ensure backward compatibility: writing a measure without `engines` behaves identically to today (global scope)

## Capabilities

### New Capabilities

- `tenant-scoped-measure-model`: Write measure models scoped to specific tenants via an optional `engines` field, with tenant-aware ID generation and 2-level fallback resolution (tenant → global)

### Modified Capabilities

- `tenant-scoped-asset-model`: Asset model write must validate that referenced measure types exist at an applicable scope (tenant or global) for the target tenant

## Impact

- `lib/modules/model/types/ModelContent.ts`: Add optional `engines` to `MeasureModelContent`
- `lib/modules/model/ModelService.ts`: Update writeMeasure/listMeasures/searchMeasures/getMeasure with tenant scoping logic
- `lib/modules/model/ModelsController.ts`: Accept `engines` and `engineId` parameters for measure actions
- `lib/modules/model/ModelSerializer.ts`: Update ID generation for tenant-scoped measure models
- `lib/modules/model/collections/modelsMappings.ts`: Add `engines` mapping to measure model
- `doc/3/controllers/models/write-measure/index.md`: Document new optional parameters
- `tests/scenario/modules/models/`: New functional tests for tenant-scoped measure models
