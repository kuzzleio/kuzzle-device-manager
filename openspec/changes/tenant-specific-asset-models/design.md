# Design: Tenant-Specific Asset Models

## Context

Asset models are stored in a centralized platform index with an `engineGroup` field. The search/list fallback is 2-level: `engineGroup → commons`. There is no mechanism to scope a model to an individual tenant (engine).

## Goals / Non-Goals

**Goals:**
- Allow asset models to be scoped to one or more specific tenants via an optional `
- 
tenants` field
- Implement a 3-level fallback chain: tenant → tenant group → commons
- Ensure backward compatibility — existing API calls without `engineId` behave identically
- Distinct model IDs per scope to avoid collisions

**Non-Goals:**
- Per-tenant ES mapping validation (Slice C — future work)
- Frontend screen for editing models (separate task)
- Extending tenant scoping to device, group, or measure models

## Decisions

### Decision 1: Optional `engineId` field on `AssetModelContent`

Add `engineId?: string` alongside the existing `engineGroup` field. When present, the model is tenant-specific. When absent, current behavior is preserved.

```typescript
export interface AssetModelContent extends KDocumentContent {
  type: "asset";
  engineGroup: string;
  engineId?: string;     // NEW — optional tenant scoping
  asset: { ... };
}
```

**Rationale:** Optional field is the least disruptive change. No migration needed for existing documents — they simply have no `engineId` and continue working as before.

### Decision 2: Model ID format includes engineId when present

Current format: `model-asset-{ModelName}`
New format when tenant-scoped: `model-asset-{engineId}-{ModelName}`

Update `ModelSerializer.id()` to include `engineId` in the ID when the model is tenant-scoped.

**Rationale:** This allows "Container" to exist as both a group-level and tenant-level model without ID collision. The ID is the Elasticsearch document `_id`, so uniqueness is critical.

### Decision 3: 3-level fallback in search/list queries

Update the Elasticsearch bool query from:

```json
{ "should": [
  { "match": { "engineGroup": "<group>" } },
  { "match": { "engineGroup": "commons" } }
]}
```

To:

```json
{ "should": [
  { "bool": { "must": [
    { "match": { "engineId": "<engineId>" } },
    { "match": { "engineGroup": "<group>" } }
  ]}},
  { "bool": {
    "must": [{ "match": { "engineGroup": "<group>" } }],
    "must_not": [{ "exists": { "field": "engineId" } }]
  }},
  { "bool": {
    "must": [{ "match": { "engineGroup": "commons" } }],
    "must_not": [{ "exists": { "field": "engineId" } }]
  }}
]}
```

When `engineId` is not provided, the query remains 2-level (current behavior).

**Rationale:** Using `must_not exists` ensures group-level and commons results don't accidentally include tenant-scoped models from other tenants.

### Decision 4: getAsset priority resolution

When `getAsset` is called with `engineId`, query for all matching models across scopes and return the most specific one:
1. Tenant-scoped match → return it
2. Group-scoped match → return it
3. Commons match → return it
4. No match → NotFoundError

**Rationale:** Tenant-specific models should override group-level defaults without requiring the admin to delete the group-level model.

### Decision 5: Controller parameter handling

`engineId` is optional in all controller actions. When provided via query string or body, it's passed through to the service. When absent, the service falls back to current 2-level behavior.

**Rationale:** Backward compatibility — existing API consumers don't need to change anything.

## ES Mapping Addition

Add to `modelsMappings.ts`:

```typescript
engineId: { type: "keyword" }
```

Alongside the existing `engineGroup` mapping.
