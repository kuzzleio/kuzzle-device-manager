## 1. Type Definitions and Mappings

- [ ] 1.1 Add optional `engines` field to `MeasureModelContent` in `ModelContent.ts`
- [ ] 1.2 Add `engines` keyword mapping to the measure section in `modelsMappings.ts`

## 2. Model ID Generation

- [ ] 2.1 Update `ModelSerializer.id()` to include sorted `engines` in measure model IDs when present
- [ ] 2.2 Update `ModelSerializer.title()` if needed for measure model scoping

## 3. Write Measure

- [ ] 3.1 Update `ModelsController.writeMeasure` to accept optional `engines` (body array)
- [ ] 3.2 Update `ModelService.writeMeasure` to pass `engines` into `MeasureModelContent` when provided
- [ ] 3.3 Update mapping conflict check to validate tenant-scoped measures against global measures only

## 4. List and Search Measures

- [ ] 4.1 Update `ModelsController.listMeasures` to accept optional `engineId` query arg
- [ ] 4.2 Update `ModelService.listMeasures` to pass `engineId` to `searchMeasures`
- [ ] 4.3 Update `ModelService.searchMeasures` to build scope-aware ES bool query (2-level fallback when engineId provided, global-only when absent)
- [ ] 4.4 Update `ModelsController.searchMeasures` to accept optional `engineId` query arg

## 5. Get Measure

- [ ] 5.1 Update `ModelsController.getMeasure` to accept optional `engineId` query arg
- [ ] 5.2 Rewrite `ModelService.getMeasure` with sequential priority queries (tenant → global) using ES DSL with `size: 1`

## 6. Asset Model Measure Validation

- [ ] 6.1 Update `writeAsset` to validate that each referenced measure type exists at an applicable scope (tenant or global) for the target tenant

## 7. Scope-Aware Measure Validation in Conflict Checker

- [ ] 7.1 In `DeviceManagerEngine.ts`, filter `measureModels` to global-only when checking platform-level twins (`group === undefined`)
- [ ] 7.2 For per-engine checks, filter `measureModels` to global + tenant-scoped for that engine
- [ ] 7.3 Add test: platform device model referencing a tenant-only measure type is rejected

## 8. API Documentation

- [ ] 8.1 Update `doc/3/controllers/models/write-measure/index.md` with new `engines` parameter

## 9. Functional Tests

- [ ] 9.1 Write tests for tenant-scoped measure model write (tenant-scoped, multi-tenant, global backward compat)
- [ ] 9.2 Write tests for mapping conflict check (tenant vs global conflict, tenant vs other tenant no conflict)
- [ ] 9.3 Write tests for list with 2-level fallback (tenant, no-scope backward compat)
- [ ] 9.4 Write tests for getMeasure with tenant priority and fallback
- [ ] 9.5 Write tests for measure model ID uniqueness across scopes

## 10. Verification

- [ ] 10.1 Run `tsc --noEmit` — no type errors
- [ ] 10.2 Run lint — no lint errors
- [ ] 10.3 Run full test suite — all tests pass
