# Tasks: Tenant-Specific Asset Models

## 1. Type & mapping changes

- [x] 1.1 Add optional `engines?: string[]` to `AssetModelContent` in `lib/modules/model/types/ModelContent.ts`
- [x] 1.2 Add `engines: { type: "keyword" }` to `lib/modules/model/collections/modelsMappings.ts`
- [x] 1.3 Update `ModelSerializer.id()` to include sorted engines in ID when present (`model-asset-{engineGroup}-{sortedEngines}-{ModelName}`)

## 2. Service logic

- [x] 2.1 Update `writeAsset` in `ModelService.ts` to accept optional `engines` array and store it in the document
- [x] 2.2 Update `listAsset` in `ModelService.ts` to support 3-level fallback when `engineId` is provided
- [x] 2.3 Update `searchAssets` in `ModelService.ts` to support 3-level fallback when `engineId` is provided
- [x] 2.4 Update `getAsset` in `ModelService.ts` to resolve with tenant priority when `engineId` is provided

## 3. Controller

- [x] 3.1 Update `writeAsset` action in `ModelsController.ts` to accept optional `engines` array from body
- [x] 3.2 Update `listAssets` action to accept optional `engineId` from query string
- [x] 3.3 Update `searchAssets` action to accept optional `engineId` from query string
- [x] 3.4 Update `getAsset` action to accept optional `engineId` from query string

## 4. Tests

- [x] 4.1 Add functional test: write a tenant-scoped asset model with engines
- [x] 4.2 Add functional test: write without engines still works (backward compat)
- [x] 4.3 Add functional test: list returns tenant + group + commons models
- [x] 4.4 Add functional test: list without engineId returns only group + commons (backward compat)
- [x] 4.5 Add functional test: same model name at tenant and group scope coexist with distinct IDs
- [x] 4.6 Add functional test: getAsset returns tenant-scoped model over group-scoped when both exist
- [x] 4.7 Add functional test: getAsset falls back to group when no tenant-scoped model exists
- [x] 4.8 Add functional test: model scoped to multiple tenants is accessible from each
- [x] 4.9 Run `tsc --noEmit` — no type errors

## 5. Verify

- [x] 5.1 Run full test suite (`npm test`) — all existing + new tests pass
