# tenant-scoped-asset-model Specification

## Purpose
TBD - created by archiving change tenant-specific-asset-models. Update Purpose after archive.
## Requirements
### Requirement: Write tenant-scoped asset model

The system SHALL allow creating an asset model scoped to one or more specific tenants, independent from the tenant group models.

#### Scenario: Create asset model scoped to specific tenants

- **WHEN** `writeAsset` is called with a tenant group and a list of tenant IDs
- **THEN** the asset model is stored with both tenant group and tenant IDs
- **AND** the model ID includes the tenant IDs to avoid collisions with group-level models of the same name

#### Scenario: Create asset model scoped to multiple tenants

- **WHEN** `writeAsset` is called with a tenant group and multiple tenant IDs
- **THEN** the asset model is accessible from each of those tenants
- **AND** a single model document is stored (no duplication)

#### Scenario: Create asset model without tenant IDs (backward compatible)

- **WHEN** `writeAsset` is called with only a tenant group (no tenant IDs)
- **THEN** the behavior is identical to the current implementation
- **AND** the tenant IDs field is not set on the stored document

---

### Requirement: List/search with tenant fallback chain

Listing and searching asset models SHALL return results from all applicable scopes using the fallback chain: tenant → tenant group → commons.

#### Scenario: List models for a specific tenant

- **WHEN** `listAssets` is called with a tenant group and a tenant ID
- **THEN** results include models scoped to that specific tenant
- **AND** results include models scoped to the tenant group (without tenant IDs)
- **AND** results include models from "commons" (without tenant IDs)
- **AND** tenant-scoped models from other tenants are excluded

#### Scenario: List models without tenant ID (backward compatible)

- **WHEN** `listAssets` is called with only a tenant group (no tenant ID)
- **THEN** results include models scoped to the tenant group and "commons"
- **AND** behavior is identical to the current implementation

#### Scenario: Search models for a specific tenant

- **WHEN** `searchAssets` is called with a tenant group, a tenant ID, and a search query
- **THEN** results are filtered by the search query
- **AND** results respect the 3-level fallback: tenant → tenant group → commons

---

### Requirement: Get asset model with tenant priority

Retrieving a specific asset model SHALL respect tenant-level priority over group-level.

#### Scenario: Tenant-scoped model takes precedence

- **WHEN** `getAsset` is called with a tenant group, a tenant ID, and a model name
- **AND** the same model name exists at both tenant and tenant-group scope
- **THEN** the tenant-scoped model is returned

#### Scenario: Fallback to tenant group when no tenant-scoped model exists

- **WHEN** `getAsset` is called with a tenant group, a tenant ID, and a model name
- **AND** no tenant-scoped model exists for that name
- **THEN** the tenant-group-scoped model is returned

---

### Requirement: Model ID uniqueness

Model IDs MUST be unique across scoping levels to allow the same model name at different scopes.

#### Scenario: Same model name at different scopes

- **WHEN** a model named "CustomAsset" is created at tenant scope (tenants: ["tenant-A"])
- **AND** a model named "CustomAsset" already exists at tenant-group scope
- **THEN** both models coexist with distinct IDs
- **AND** no collision or overwrite occurs

---

### Requirement: Type safety

All changes MUST compile cleanly with the existing TypeScript configuration.

#### Scenario: Type check passes

- **WHEN** `tsc --noEmit` is run
- **THEN** no type errors are reported
- **AND** the new optional `engines` field does not break existing code

