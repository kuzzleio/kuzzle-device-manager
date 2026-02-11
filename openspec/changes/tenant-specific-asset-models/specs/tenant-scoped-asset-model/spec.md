# Tenant-Scoped Asset Model

## ADDED Requirements

### Requirement: Write tenant-scoped asset model

A tenant admin can create an asset model scoped to their specific tenant, independent from the tenant group models.

#### Scenario: Create asset model with engineId

- **WHEN** `writeAsset` is called with a valid `engineId` and `engineGroup`
- **THEN** the asset model is stored with both `engineGroup` and `engineId` fields
- **AND** the model ID includes the engineId to avoid collisions with group-level models of the same name

#### Scenario: Create asset model without engineId (backward compatible)

- **WHEN** `writeAsset` is called with only `engineGroup` (no `engineId`)
- **THEN** the behavior is identical to the current implementation
- **AND** the `engineId` field is not set on the stored document

---

### Requirement: List/search with tenant fallback chain

Listing and searching asset models returns results from all applicable scopes using the fallback chain: tenant → tenant group → commons.

#### Scenario: List models for a specific tenant

- **WHEN** `listAssets` is called with `engineGroup` and `engineId`
- **THEN** results include models scoped to that specific tenant
- **AND** results include models scoped to the tenant group
- **AND** results include models from "commons"

#### Scenario: List models without engineId (backward compatible)

- **WHEN** `listAssets` is called with only `engineGroup` (no `engineId`)
- **THEN** results include models scoped to the tenant group and "commons"
- **AND** behavior is identical to the current implementation

#### Scenario: Search models for a specific tenant

- **WHEN** `searchAssets` is called with `engineGroup`, `engineId`, and a search query
- **THEN** results are filtered by the search query
- **AND** results respect the 3-level fallback: tenant → tenant group → commons

---

### Requirement: Get asset model with tenant priority

Retrieving a specific asset model respects tenant-level priority over group-level.

#### Scenario: Tenant-scoped model takes precedence

- **WHEN** `getAsset` is called with `engineGroup`, `engineId`, and a model name
- **AND** the same model name exists at both tenant and tenant-group scope
- **THEN** the tenant-scoped model is returned

#### Scenario: Fallback to tenant group when no tenant-scoped model exists

- **WHEN** `getAsset` is called with `engineGroup`, `engineId`, and a model name
- **AND** no tenant-scoped model exists for that name
- **THEN** the tenant-group-scoped model is returned

---

### Requirement: Model ID uniqueness

Model IDs must be unique across scoping levels to allow the same model name at different scopes.

#### Scenario: Same model name at different scopes

- **WHEN** a model named "CustomAsset" is created at tenant scope (engineId: "tenant-A")
- **AND** a model named "CustomAsset" already exists at tenant-group scope
- **THEN** both models coexist with distinct IDs
- **AND** no collision or overwrite occurs

---

### Requirement: Type safety

All changes compile cleanly with the existing TypeScript configuration.

#### Scenario: Type check passes

- **WHEN** `tsc --noEmit` is run
- **THEN** no type errors are reported
- **AND** the new optional `engineId` field does not break existing code
