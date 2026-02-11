# Tasks: Tenant-Specific Asset Models

## 1. Type & mapping changes

- [ ] 1.1 Add optional `engineId?: string` to `AssetModelContent` in `lib/modules/model/types/ModelContent.ts`
- [ ] 1.2 Add `engineId: { type: "keyword" }` to `lib/modules/model/collections/modelsMappings.ts`
- [ ] 1.3 Update `ModelSerializer.id()` to include `engineId` in ID when present (`model-asset-{engineId}-{ModelName}`)

## 2. Service logic

- [ ] 2.1 Update `writeAsset` in `ModelService.ts` to accept optional `engineId` and store it in the document
- [ ] 2.2 Update `listAsset` in `ModelService.ts` to support 3-level fallback when `engineId` is provided
- [ ] 2.3 Update `searchAssets` in `ModelService.ts` to support 3-level fallback when `engineId` is provided
- [ ] 2.4 Update `getAsset` in `ModelService.ts` to resolve with tenant priority when `engineId` is provided

## 3. Controller

- [ ] 3.1 Update `writeAsset` action in `ModelsController.ts` to accept optional `engineId` from body
- [ ] 3.2 Update `listAssets` action to accept optional `engineId` from query string
- [ ] 3.3 Update `searchAssets` action to accept optional `engineId` from query string
- [ ] 3.4 Update `getAsset` action to accept optional `engineId` from query string

## 4. Tests

- [ ] 4.1 Add functional test: write a tenant-scoped asset model
- [ ] 4.2 Add functional test: write without engineId still works (backward compat)
- [ ] 4.3 Add functional test: list returns tenant + group + commons models
- [ ] 4.4 Add functional test: list without engineId returns only group + commons (backward compat)
- [ ] 4.5 Add functional test: same model name at tenant and group scope coexist with distinct IDs
- [ ] 4.6 Add functional test: getAsset returns tenant-scoped model over group-scoped when both exist
- [ ] 4.7 Add functional test: getAsset falls back to group when no tenant-scoped model exists
- [ ] 4.8 Run `tsc --noEmit` — no type errors

## 5. Verify

- [ ] 5.1 Run full test suite (`npm test`) — all existing + new tests pass
