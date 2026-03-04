# Design: Tenant-Scoped Measure Models

## Context

Measure models are currently stored in the platform index with no scoping — they are global to the entire platform. With KZLPRD-1150, asset models gained tenant scoping via `engineGroup` and `engines` fields. Now, users creating tenant-scoped assets need matching tenant-scoped measure types. Unlike asset models which are scoped to an engine group, measure models only need direct tenant scoping via `engines`.

## Goals / Non-Goals

**Goals:**
- Allow measure models to be scoped to specific tenants via an optional `engines` field
- Implement a 2-level fallback: tenant → global
- Backward compatibility — existing measure writes without `engines` remain global
- Distinct model IDs per scope to avoid collisions
- Mapping conflict check: tenant-scoped measures must be consistent with global measures only

**Non-Goals:**
- Adding `engineGroup` to measure models (measures don't have group-level scoping)
- Cross-tenant measure conflict detection (tenant A vs tenant B)
- Automatically scoping measure models when referenced by a tenant-scoped asset model
- Extending tenant scoping to device or group models

## Decisions

### Decision 1: Add optional `engines` to `MeasureModelContent`

```typescript
export interface MeasureModelContent extends KDocumentContent {
  type: "measure";
  engines?: string[];       // NEW — optional tenant-level scoping
  measure: MeasureDefinition & {
    type: string;
    locales?: { [valueName: string]: LocaleDetails };
  };
}
```

**Rationale:** Unlike asset models which have `engineGroup` for group-level scoping, measure models only need direct tenant scoping. A measure is either global (no `engines`) or tenant-scoped (has `engines` array). No `engineGroup` is needed because measures don't have a group-level concept.

**Alternative considered:** Adding `engineGroup` like asset models — rejected because it adds unnecessary complexity. Measures are either global or tenant-specific.

### Decision 2: Measure model ID format

Current: `model-measure-{type}`
With tenant scope: `model-measure-{sortedEngines}-{type}`

Example: `model-measure-engine-ayse-temperature`, `model-measure-engine-ayse+engine-kuzzle-temperature`

Update `ModelSerializer.id()` to include sorted engines in the ID when the model is tenant-scoped.

**Rationale:** Allows "temperature" to exist as both global and tenant-scoped without ID collision. Sorting ensures deterministic IDs.

### Decision 3: 2-level fallback in list/search/get

- **listMeasures/searchMeasures**: When `engineId` is provided, use a `bool.should` query matching tenant-scoped (engines contains engineId) and global (no engines field). When `engineId` is absent, return only global measures (backward compat).

- **getMeasure**: Sequential priority queries with `size: 1` — tenant-scoped first, then global. Same pattern as the refactored `getAsset`.

**Rationale:** Simpler than the 3-level asset model fallback because there's no group-level scoping.

### Decision 4: Mapping conflict check

When writing a tenant-scoped measure, check for conflicts against **global measures only** (not against measures scoped to other tenants). Different tenants can define the same measure type with different mappings.

**Rationale:** Each tenant's ES index is independent. Mappings only conflict when merged into the same index, which happens with global measures that apply everywhere.

### Decision 5: Controller parameter handling

- `writeMeasure`: Accept optional `engines` (body array) alongside existing `type`, `valuesMappings`, etc.
- `listMeasures`/`searchMeasures`: Accept optional `engineId` (query arg)
- `getMeasure`: Accept optional `engineId` (query arg)

Use `request.getBodyArray`/`request.getString` with defaults.

**Rationale:** Backward compatibility — all new parameters are optional.

### Decision 6: Measure mappings update

Add to `modelsMappings.ts` under the measure section (at document root level, not nested under `measure`):

```typescript
engines: { type: "keyword" }
```

**Rationale:** `keyword` type naturally supports arrays in ES.

### Decision 7: Scope-aware measure validation in twin conflict checker

`DeviceManagerEngine.doesTwinUpdateConflicts` validates that every measure type referenced by a device or asset model actually exists. Currently it fetches ALL measures (global + tenant-scoped) and checks against that flat list.

With tenant-scoped measures, this must be scoped:
- **Platform-level twins** (no `engines` field, `group === undefined`): only global measures (no `engines` field) are valid references. A platform device cannot depend on a tenant-only measure.
- **Per-engine twins**: global measures + tenant-scoped measures for that specific engine are valid.

**Rationale:** Device models are platform-level (no scoping, per Eric's decision). A platform device referencing a tenant-only measure would pass validation but fail at runtime. The conflict checker must enforce scope consistency.

## Risks / Trade-offs

- **[Multiple queries in getMeasure]** → Sequential priority queries (up to 2) add latency. Mitigation: measure model lookups are infrequent and each query is fast with `size: 1`.
- **[No cross-tenant conflict detection]** → Two tenants can define "temperature" with incompatible mappings. Mitigation: explicitly out of scope; each tenant has its own ES index.
- **[Migration of existing measures]** → Existing measures have no `engines` field. They are implicitly global. No migration needed — queries use `must_not exists` to match documents without the field.
