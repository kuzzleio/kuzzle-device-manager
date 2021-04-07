Feature: Device Manager device controller

  Scenario: Attach a device to a tenant
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "DummyTemp_detached" |
      | index | "tenant-kuzzle"      |
    Then The document "device-manager":"devices":"DummyTemp_detached" content match:
      | tenantId | "tenant-kuzzle" |
    And The document "tenant-kuzzle":"devices":"DummyTemp_detached" exists

  Scenario: Attach multiple devices to a tenant using JSON
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/device":"mAttach" with args:
      | body.records.0.tenantId | "tenant-kuzzle"                    |
      | body.records.0.deviceId | "DummyTemp_detached"               |
      | body.records.1.tenantId | "tenant-kuzzle"                    |
      | body.records.1.deviceId | "DummyTemp_attached-ayse-unlinked" |
    Then The document "device-manager":"devices":"DummyTemp_detached" content match:
      | tenantId | "tenant-kuzzle" |
    Then The document "device-manager":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | tenantId | "tenant-kuzzle" |
    And The document "tenant-kuzzle":"devices":"DummyTemp_detached" exists
    And The document "tenant-kuzzle":"devices":"DummyTemp_attached-ayse-unlinked" exists

  Scenario: Attach multiple device to a tenant using CSV
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/device":"mAttach" with args:
      | body.csv | "tenantId,deviceId\\ntenant-kuzzle,DummyTemp_detached\\ntenant-kuzzle,DummyTemp_attached-ayse-unlinked," |
    Then The document "device-manager":"devices":"DummyTemp_detached" content match:
      | tenantId | "tenant-kuzzle" |
    Then The document "device-manager":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | tenantId | "tenant-kuzzle" |
    And The document "tenant-kuzzle":"devices":"DummyTemp_detached" exists
    And The document "tenant-kuzzle":"devices":"DummyTemp_attached-ayse-unlinked" exists

  Scenario: Attach multiple device to a tenant while exceeding documentsWriteCount limit
    Given an engine on index "tenant-kuzzle"
    When I succesfully execute "device-manager/device":"mAttach" while exeding documentsWriteCount limit
    Then All devices in "device-manager" "devices" have the property "tenantId" to "tenant-kuzzle"
    And All documents "tenant-kuzzle":"devices"  exists

  Scenario: Error when assigning a device to a tenant
    Given an engine on index "tenant-kuzzle"
    When I execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "DummyTemp_detached" |
      | index | "tenant-kaliop"      |
    Then I should receive an error matching:
      | message | "Tenant \"tenant-kaliop\" does not have a device-manager engine" |
    And I successfully execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "DummyTemp_detached" |
      | index | "tenant-kuzzle"      |
    When I execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "DummyTemp_detached" |
      | index | "tenant-kuzzle"      |
    Then I should receive an error matching:
      | message | "These devices \"DummyTemp_detached\" are already attached to a tenant" |

  Scenario: Detach device from a tenant
    Given an engine on index "tenant-kuzzle"
    And I successfully execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "DummyTemp_detached" |
      | index | "tenant-kuzzle"      |
    When I successfully execute the action "device-manager/device":"detach" with args:
      | _id | "DummyTemp_detached" |
    Then The document "device-manager":"devices":"DummyTemp_detached" content match:
      | tenantId | null |
    And The document "tenant-kuzzle":"devices":"DummyTemp_detached" does not exists

  Scenario: Detach multiple devices to a tenant using JSON
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/device":"mAttach" with args:
      | body.records.0.tenantId | "tenant-kuzzle"                    |
      | body.records.0.deviceId | "DummyTemp_detached"               |
      | body.records.1.tenantId | "tenant-kuzzle"                    |
      | body.records.1.deviceId | "DummyTemp_attached-ayse-unlinked" |
    When I successfully execute the action "device-manager/device":"mDetach" with args:
      | body.deviceIds | ["DummyTemp_detached","DummyTemp_attached-ayse-unlinked"] |
    Then The document "device-manager":"devices":"DummyTemp_detached" content match:
      | tenantId | null |
    Then The document "device-manager":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | tenantId | null |
    And The document "tenant-kuzzle":"devices":"DummyTemp_detached" does not exists
    And The document "tenant-kuzzle":"devices":"DummyTemp_attached-ayse-unlinked" does not exists

  Scenario: Detach multiple devices to a tenant using CSV
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/device":"mAttach" with args:
      | body.csv | "tenantId,deviceId\\ntenant-kuzzle,DummyTemp_detached\\ntenant-kuzzle,DummyTemp_attached-ayse-unlinked," |
    When I successfully execute the action "device-manager/device":"mDetach" with args:
      | body.csv | "deviceId\\nDummyTemp_detached\\nDummyTemp_attached-ayse-unlinked," |
    Then The document "device-manager":"devices":"DummyTemp_detached" content match:
      | tenantId | null |
    Then The document "device-manager":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | tenantId | null |
    And The document "tenant-kuzzle":"devices":"DummyTemp_detached" does not exists
    And The document "tenant-kuzzle":"devices":"DummyTemp_attached-ayse-unlinked" does not exists

  Scenario: Detach multiple device to a tenant while exceeding documentsWriteCount limit
    Given an engine on index "tenant-kuzzle"
    When I succesfully execute "device-manager/device":"mAttach" while exeding documentsWriteCount limit
    When I succesfully execute "device-manager/device":"mDetach" while exeding documentsWriteCount limit
    Then All devices in "device-manager" "devices" have the property "tenantId" to "null"
    And All documents "tenant-kuzzle":"devices" does not exists

  Scenario: Error when detaching from a tenant
    Given an engine on index "tenant-kuzzle"
    When I execute the action "device-manager/device":"detach" with args:
      | _id | "DummyTemp_detached" |
    Then I should receive an error matching:
      | message | "Devices \"DummyTemp_detached\" are not attached to a tenant" |
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp_attached-ayse-unlinked" |
      | assetId | "PERFO-unlinked"                   |
    When I execute the action "device-manager/device":"detach" with args:
      | _id | "DummyTemp_attached-ayse-unlinked" |
    Then I should receive an error matching:
      | message | "Devices \"DummyTemp_attached-ayse-unlinked\" are still linked to an asset" |

  Scenario: Link device to an asset
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp_attached-ayse-unlinked" |
      | assetId | "PERFO-unlinked"                   |
    Then The document "device-manager":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures.temperature.id          | "DummyTemp_attached-ayse-unlinked" |
      | measures.temperature.model       | "DummyTemp"                        |
      | measures.temperature.reference   | "attached-ayse-unlinked"           |
      | measures.temperature.updatedAt   | 1610793427950                      |
      | measures.temperature.payloadUuid | "_STRING_"                         |
      | measures.temperature.degree      | 23.3                               |
      | measures.temperature.qos.battery | 80                                 |

  Scenario: Link multiple device to multiple assets using JSON
    When I successfully execute the action "device-manager/device":"mLink" with args:
      | body.records.0.deviceId | "DummyTemp_attached-ayse-unlinked" |
      | body.records.0.assetId  | "PERFO-unlinked"                   |
    Then The document "device-manager":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures.temperature.id          | "DummyTemp_attached-ayse-unlinked" |
      | measures.temperature.model       | "DummyTemp"                        |
      | measures.temperature.reference   | "attached-ayse-unlinked"           |
      | measures.temperature.updatedAt   | 1610793427950                      |
      | measures.temperature.payloadUuid | "_STRING_"                         |
      | measures.temperature.degree      | 23.3                               |
      | measures.temperature.qos.battery | 80                                 |

  Scenario: Link multiple device to multiple assets using CSV
    When I successfully execute the action "device-manager/device":"mLink" with args:
      | body.csv | "deviceId,assetId\\nDummyTemp_attached-ayse-unlinked,PERFO-unlinked" |
    Then The document "device-manager":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | assetId | "PERFO-unlinked" |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures.temperature.id          | "DummyTemp_attached-ayse-unlinked" |
      | measures.temperature.model       | "DummyTemp"                        |
      | measures.temperature.reference   | "attached-ayse-unlinked"           |
      | measures.temperature.updatedAt   | 1610793427950                      |
      | measures.temperature.payloadUuid | "_STRING_"                         |
      | measures.temperature.degree      | 23.3                               |
      | measures.temperature.qos.battery | 80                                 |

  Scenario: Error when linking device to an asset
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp_detached" |
      | assetId | "PERFO-unlinked"     |
    Then I should receive an error matching:
      | message | "Devices \"DummyTemp_detached\" are not attached to a tenant" |
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp_attached-ayse-unlinked" |
      | assetId | "PERFO-non-existing"               |
    Then I should receive an error matching:
      | message | "Assets \"PERFO-non-existing\" do not exist" |

  Scenario: Error when unlinking from an asset
    When I execute the action "device-manager/device":"unlink" with args:
      | _id | "DummyTemp_attached-ayse-unlinked" |
    Then I should receive an error matching:
      | message | "Devices \"DummyTemp_attached-ayse-unlinked\" are not linked to an asset" |

  Scenario: Unlink multiple devices from multiple assets using JSON
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp_attached-ayse-unlinked" |
      | assetId | "PERFO-unlinked"                   |
    When I successfully execute the action "device-manager/device":"mUnlink" with args:
      | body.records.0.deviceId | "DummyTemp_attached-ayse-unlinked" |
    Then The document "device-manager":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | assetId | null |
    Then The document "tenant-ayse":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | assetId | null |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures | {} |

  Scenario: Unlink multiple devices from multiple assets using CSV
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp_attached-ayse-unlinked" |
      | assetId | "PERFO-unlinked"                   |
    When I successfully execute the action "device-manager/device":"mUnlink" with args:
      | body.csv | "deviceId\\nDummyTemp_attached-ayse-unlinked" |
    Then The document "device-manager":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | assetId | null |
    Then The document "tenant-ayse":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | assetId | null |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures | {} |

  Scenario: Unlink device from an asset
    And I successfully execute the action "device-manager/device":"attachTenant" with args:
      | _id   | "DummyTemp_detached" |
      | index | "tenant-ayse"        |
    When I successfully execute the action "device-manager/device":"mLink" with args:
      | body.records.0.deviceId | "DummyTemp_attached-ayse-unlinked" |
      | body.records.0.assetId  | "PERFO-unlinked"                   |
      | body.records.1.deviceId | "DummyTemp_detached"               |
      | body.records.1.assetId  | "PERFO-unlinked"                   |
    When I successfully execute the action "device-manager/device":"unlink" with args:
      | _id | "DummyTemp_attached-ayse-unlinked" |
    Then The document "device-manager":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | assetId | null |
    Then The document "tenant-ayse":"devices":"DummyTemp_attached-ayse-unlinked" content match:
      | assetId | null |
    And The document "tenant-ayse":"assets":"PERFO-unlinked" content match:
      | measures.position.reference   | "detached"    |
      | measures.position.payloadUuid | "some-uuid"   |
      | measures.position.accuracy    | 42            |
      | measures.position.model       | "_STRING_"    |
      | measures.position.id          | "_STRING_"    |
      | measures.position.point.lon   | 3.876716      |
      | measures.position.point.lat   | 43.610767     |
      | measures.position.updatedAt   | 1610793427950 |

  Scenario: Clean payloads collection
    Given I successfully execute the action "collection":"truncate" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345" |
      | register55   | 23.3    |
      | batteryLevel | 0.8     |
    And I successfully receive a "dummy-temp-position" payload with:
      | deviceEUI     | "12345" |
      | register55    | 23.3    |
      | location.lat  | 42.2    |
      | location.lon  | 2.42    |
      | location.accu | 2100    |
    And I successfully execute the action "collection":"refresh" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I successfully execute the action "document":"search" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I should receive a result matching:
      | total | 2 |
    And I successfully execute the action "device-manager/device":"prunePayloads" with args:
      | body.days        | 0           |
      | body.deviceModel | "DummyTemp" |
    And I successfully execute the action "collection":"refresh" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I successfully execute the action "document":"search" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I should receive a result matching:
      | total | 1 |
