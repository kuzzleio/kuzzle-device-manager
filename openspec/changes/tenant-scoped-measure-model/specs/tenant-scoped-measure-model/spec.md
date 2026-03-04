## ADDED Requirements

### Requirement: Write tenant-scoped measure model

The system SHALL allow creating a measure model scoped to one or more specific tenants via an optional `engines` field.

#### Scenario: Create measure model scoped to specific tenants

- **WHEN** `writeMeasure` is called with a type, valuesMappings, and a list of `engines` (tenant IDs)
- **THEN** the measure model is stored with the tenant IDs
- **AND** the model ID includes the sorted engine IDs (e.g., `model-measure-engine-ayse-temperature`)

#### Scenario: Create measure model scoped to multiple tenants

- **WHEN** `writeMeasure` is called with multiple `engines`
- **THEN** the measure model is accessible from each of those tenants
- **AND** a single model document is stored (no duplication)
- **AND** the sorted engine IDs appear in the model ID

#### Scenario: Create global measure model (backward compatible)

- **WHEN** `writeMeasure` is called without `engines`
- **THEN** the behavior is identical to the current implementation
- **AND** the model is stored as a global measure (no engines field)
- **AND** the model ID format is unchanged (e.g., `model-measure-temperature`)

---

### Requirement: Mapping conflict check against global scope only

Tenant-scoped measure models MUST have mappings consistent with global measures, but NOT with measures scoped to other tenants.

#### Scenario: Tenant measure conflicts with global measure

- **WHEN** `writeMeasure` is called with `engines` and valuesMappings that conflict with an existing global measure of the same type
- **THEN** the system SHALL reject the request with a 409 MappingsConflictsError

#### Scenario: Tenant measure does not conflict with other tenant's measure

- **WHEN** `writeMeasure` is called with `engines: ["engine-ayse"]` and a type that also exists scoped to `engines: ["engine-kuzzle"]` with different mappings
- **THEN** the system SHALL accept the request
- **AND** both tenant-scoped measures coexist independently

---

### Requirement: List/search measures with tenant fallback

Listing and searching measure models SHALL return results from applicable scopes using the 2-level fallback: tenant → global.

#### Scenario: List measures for a specific tenant

- **WHEN** `listMeasures` is called with an `engineId`
- **THEN** results include measures scoped to that specific tenant
- **AND** results include global measures (without engines)
- **AND** tenant-scoped measures from other tenants are excluded

#### Scenario: List measures without scoping (backward compatible)

- **WHEN** `listMeasures` is called without `engineId`
- **THEN** results include only global measures
- **AND** behavior is identical to the current implementation

#### Scenario: Search measures for a specific tenant

- **WHEN** `searchMeasures` is called with an `engineId` and a search query
- **THEN** results are filtered by the search query
- **AND** results respect the 2-level fallback: tenant → global

---

### Requirement: Get measure model with tenant priority

Retrieving a specific measure model SHALL respect tenant-level priority over global.

#### Scenario: Tenant-scoped measure takes precedence

- **WHEN** `getMeasure` is called with a type and an `engineId`
- **AND** the same measure type exists at both tenant and global scope
- **THEN** the tenant-scoped measure model is returned

#### Scenario: Fallback to global when no tenant-scoped measure exists

- **WHEN** `getMeasure` is called with a type and an `engineId`
- **AND** no tenant-scoped measure exists for that type
- **AND** a global measure exists
- **THEN** the global measure model is returned

#### Scenario: Get measure without scoping (backward compatible)

- **WHEN** `getMeasure` is called with only a type (no `engineId`)
- **THEN** the global measure model is returned
- **AND** behavior is identical to the current implementation

---

### Requirement: Measure model ID uniqueness

Measure model IDs MUST be unique across scoping levels to allow the same measure type at different scopes.

#### Scenario: Same measure type at different scopes

- **WHEN** a measure type "temperature" is created at tenant scope (engines: ["engine-ayse"])
- **AND** a measure type "temperature" already exists as a global measure
- **THEN** both models coexist with distinct IDs
- **AND** no collision or overwrite occurs

---

### Requirement: Type safety

All changes MUST compile cleanly with the existing TypeScript configuration.

#### Scenario: Type check passes

- **WHEN** `tsc --noEmit` is run
- **THEN** no type errors are reported
- **AND** the new optional `engines` field does not break existing code
