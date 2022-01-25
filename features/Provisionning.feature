Feature: Device Provisioning

  @provisioning
  Scenario: Provision device in the catalog
    Given a collection "device-manager":"config"
    And I "update" the document "plugin--device-manager" with content:
      | device-manager.provisioningStrategy | "catalog" |
    And I "create" the document "custom-catalog-id" with content:
      | type               | "catalog"         |
      | catalog.deviceId   | "DummyTemp.12345" |
      | catalog.authorized | true              |
    And I "create" the document "catalog--DummyTemp.424242" with content:
      | type               | "catalog"          |
      | catalog.deviceId   | "DummyTemp.424242" |
      | catalog.authorized | false              |
    And I refresh the collection "device-manager":"config"
    # Provisioned device
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345" |
      | register55   | 23.3    |
      | batteryLevel | 0.8     |
    Then The document "device-manager":"devices":"DummyTemp.12345" exists
    # Provisioning events
    And The document "tests":"events":"device-manager:device:provisioning:before" content match:
      | deviceId      | "DummyTemp.12345" |
      | adminCatalog  | "_OBJECT_"        |
    And The document "tests":"events":"device-manager:device:provisioning:after" content match:
      | device._id     | "DummyTemp.12345" |
      | device._source | "_OBJECT_"        |
      | adminCatalog   | "_OBJECT_"        |
    # Provisioned device but not authorized
    When I receive a "dummy-temp" payload with:
      | deviceEUI    | "424242" |
      | register55   | 23.3     |
      | batteryLevel | 0.8      |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp.424242\" is not allowed for registration." |
    And The document "device-manager":"devices":"DummyTemp.424242" does not exists
    # Unprovisioned device
    When I receive a "dummy-temp" payload with:
      | deviceEUI    | "212121" |
      | register55   | 23.3     |
      | batteryLevel | 0.8      |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp.212121\" is not provisioned." |
    And The document "device-manager":"devices":"DummyTemp.212121" does not exists

  Scenario: Admin catalog: Assign to tenant and asset
    Given a collection "device-manager":"config"
    And I "create" the document "catalog--DummyTemp.12345" with content:
      | type             | "catalog"              |
      | catalog.deviceId | "DummyTemp.12345"      |
      | catalog.engineId | "tenant-ayse"          |
      | catalog.assetId  | "tools.PERFO.unlinked" |
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345" |
      | register55   | 23.3    |
      | batteryLevel | 0.8     |
    Then The document "tenant-ayse":"devices":"DummyTemp.12345" exists
    And The document "tenant-ayse":"devices":"DummyTemp.12345" content match:
      | assetId | "tools.PERFO.unlinked" |

  Scenario: Tenant catalog: Assign to asset
    Given a collection "device-manager":"config"
    And I "create" the document "catalog--DummyTemp.12345" with content:
      | type             | "catalog"         |
      | catalog.deviceId | "DummyTemp.12345" |
      | catalog.engineId | "tenant-ayse"     |
    Given a collection "tenant-ayse":"config"
    And I "create" the document "catalog--DummyTemp.12345" with content:
      | type             | "catalog"              |
      | catalog.deviceId | "DummyTemp.12345"      |
      | catalog.assetId  | "tools.PERFO.unlinked" |
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345" |
      | register55   | 23.3    |
      | batteryLevel | 0.8     |
    Then The document "tenant-ayse":"devices":"DummyTemp.12345" content match:
      | assetId | "tools.PERFO.unlinked" |
