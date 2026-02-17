## ADDED Requirements

### Requirement: Asset model validates measure types at applicable scope

When writing an asset model with measure definitions, the system SHALL verify that each referenced measure type exists at an applicable scope for the target tenant.

#### Scenario: Asset references a tenant-scoped measure type

- **WHEN** `writeAsset` is called with a measure referencing type "custom-temp"
- **AND** "custom-temp" exists as a tenant-scoped measure for the same tenant
- **THEN** the asset model is created successfully

#### Scenario: Asset references a global measure type

- **WHEN** `writeAsset` is called with a measure referencing type "temperature"
- **AND** "temperature" exists as a global measure
- **THEN** the asset model is created successfully regardless of tenant scoping

#### Scenario: Asset references a non-existent measure type at its scope

- **WHEN** `writeAsset` is called with a measure referencing type "custom-temp"
- **AND** "custom-temp" does not exist at the tenant or global scope applicable to the asset
- **THEN** the system SHALL reject the request with an error
