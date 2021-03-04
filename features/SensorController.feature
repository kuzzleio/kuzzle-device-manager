Feature: Device Manager sensor controller

  Scenario: Attach a sensor to a tenant
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/sensor":"attachTenant" with args:
      | _id   | "DummyTemp/detached" |
      | index | "tenant-kuzzle"      |
    Then The document "device-manager":"sensors":"DummyTemp/detached" content match:
      | tenantId | "tenant-kuzzle" |
    And The document "tenant-kuzzle":"sensors":"DummyTemp/detached" exists

  Scenario: Attach multiple sensors to a tenant using JSON
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/sensor":"mAttachTenant" with args:
      | body.records.0.tenant | "tenant-kuzzle"                    |
      | body.records.0.id     | "DummyTemp/detached"               |
      | body.records.1.tenant | "tenant-kuzzle"                    |
      | body.records.1.id     | "DummyTemp/attached-ayse-unlinked" |
    Then The document "device-manager":"sensors":"DummyTemp/detached" content match:
      | tenantId | "tenant-kuzzle" |
    Then The document "device-manager":"sensors":"DummyTemp/attached-ayse-unlinked" content match:
      | tenantId | "tenant-kuzzle" |
    And The document "tenant-kuzzle":"sensors":"DummyTemp/detached" exists
    And The document "tenant-kuzzle":"sensors":"DummyTemp/attached-ayse-unlinked" exists

  Scenario: Attach multiple sensor to a tenant using CSV
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/sensor":"mAttachTenant" with args:
      | body.csv | "tenant,id\\ntenant-kuzzle,DummyTemp\/detached\\ntenant-kuzzle,DummyTemp\/attached-ayse-unlinked," |
    Then The document "device-manager":"sensors":"DummyTemp/detached" content match:
      | tenantId | "tenant-kuzzle" |
    Then The document "device-manager":"sensors":"DummyTemp/attached-ayse-unlinked" content match:
      | tenantId | "tenant-kuzzle" |
    And The document "tenant-kuzzle":"sensors":"DummyTemp/detached" exists
    And The document "tenant-kuzzle":"sensors":"DummyTemp/attached-ayse-unlinked" exists

  Scenario: Error when assigning a sensor to a tenant
    Given an engine on index "tenant-kuzzle"
    When I execute the action "device-manager/sensor":"attachTenant" with args:
      | _id   | "DummyTemp/detached" |
      | index | "tenant-kaliop"      |
    Then I should receive an error matching:
      | message | "Tenant \"tenant-kaliop\" does not have a device-manager engine" |
    And I successfully execute the action "device-manager/sensor":"attachTenant" with args:
      | _id   | "DummyTemp/detached" |
      | index | "tenant-kuzzle"      |
    When I execute the action "device-manager/sensor":"attachTenant" with args:
      | _id   | "DummyTemp/detached" |
      | index | "tenant-kuzzle"      |
    Then I should receive an error matching:
      | message | "These sensors \"DummyTemp/detached\" are already attached to a tenant" |

  Scenario: Detach sensor from a tenant
    Given an engine on index "tenant-kuzzle"
    And I successfully execute the action "device-manager/sensor":"attachTenant" with args:
      | _id   | "DummyTemp/detached" |
      | index | "tenant-kuzzle"      |
    When I successfully execute the action "device-manager/sensor":"detach" with args:
      | _id | "DummyTemp/detached" |
    Then The document "device-manager":"sensors":"DummyTemp/detached" content match:
      | tenantId | null |
    And The document "tenant-kuzzle":"sensors":"DummyTemp/detached" does not exists
  
  Scenario: Detach multiple sensors from multiple tenant using JSON
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/sensor":"mAttachTenant" with args:
      | body.records.0.tenant | "tenant-kuzzle"                    |
      | body.records.0.id     | "DummyTemp/detached"               |
      | body.records.1.tenant | "tenant-kuzzle"                    |
      | body.records.1.id     | "DummyTemp/attached-ayse-unlinked" |
    When I successfully execute the action "device-manager/sensor":"mDetach" with args:
      | body.records.0.tenant | "tenant-kuzzle"                    |
      | body.records.0.id     | "DummyTemp/detached"               |
      | body.records.1.tenant | "tenant-kuzzle"                    |
      | body.records.1.id     | "DummyTemp/attached-ayse-unlinked" |
    Then The document "device-manager":"sensors":"DummyTemp/detached" content match:
      | tenantId | null |
    Then The document "device-manager":"sensors":"DummyTemp/attached-ayse-unlinked" content match:
      | tenantId | null |
    And The document "tenant-kuzzle":"sensors":"DummyTemp/detached" does not exists
    And The document "tenant-kuzzle":"sensors":"DummyTemp/attached-ayse-unlinked" does not exists

  Scenario: Detach multiple sensors from multiple tenant using CSV
    Given an engine on index "tenant-kuzzle"
    And I successfully execute the action "device-manager/sensor":"mAttachTenant" with args:
      | body.csv | "tenant,id\\ntenant-kuzzle,DummyTemp\/detached\\ntenant-kuzzle,DummyTemp\/attached-ayse-unlinked," |
    When I successfully execute the action "device-manager/sensor":"mDetach" with args:
      | body.csv | "tenant,id\\ntenant-kuzzle,DummyTemp\/detached\\ntenant-kuzzle,DummyTemp\/attached-ayse-unlinked," |
    Then The document "device-manager":"sensors":"DummyTemp/detached" content match:
      | tenantId | null |
    Then The document "device-manager":"sensors":"DummyTemp/attached-ayse-unlinked" content match:
      | tenantId | null |
    And The document "tenant-kuzzle":"sensors":"DummyTemp/detached" does not exists
    And The document "tenant-kuzzle":"sensors":"DummyTemp/attached-ayse-unlinked" does not exists

  Scenario: Error when unassigning from a tenant
    Given an engine on index "tenant-kuzzle"
    When I execute the action "device-manager/sensor":"detach" with args:
      | _id | "DummyTemp/detached" |
    Then I should receive an error matching:
      | message | "Sensors \"DummyTemp/detached\" are not attached to a tenant" |
    Given I successfully execute the action "device-manager/sensor":"linkAsset" with args:
      | _id     | "DummyTemp/attached-ayse-unlinked" |
      | assetId | "PERFO/unlinked"                   |
    When I execute the action "device-manager/sensor":"detach" with args:
      | _id | "DummyTemp/attached-ayse-unlinked" |
    Then I should receive an error matching:
      | message | "Sensors \"DummyTemp/attached-ayse-unlinked\" are still linked to an asset" |

  Scenario: Link sensor to an asset
    When I successfully execute the action "device-manager/sensor":"linkAsset" with args:
      | _id     | "DummyTemp/attached-ayse-unlinked" |
      | assetId | "PERFO/unlinked"                   |
    Then The document "device-manager":"sensors":"DummyTemp/attached-ayse-unlinked" content match:
      | assetId | "PERFO/unlinked" |
    And The document "tenant-ayse":"sensors":"DummyTemp/attached-ayse-unlinked" content match:
      | assetId | "PERFO/unlinked" |
    And The document "tenant-ayse":"assets":"PERFO/unlinked" content match:
      | measures.temperature.id          | "DummyTemp/attached-ayse-unlinked" |
      | measures.temperature.model       | "DummyTemp"                        |
      | measures.temperature.reference   | "attached-ayse-unlinked"           |
      | measures.temperature.updatedAt   | 1610793427950                      |
      | measures.temperature.payloadUuid | "_STRING_"                         |
      | measures.temperature.value       | 23.3                               |
      | measures.temperature.qos.battery | 80                                 |

  Scenario: Error when linking sensor to an asset
    When I execute the action "device-manager/sensor":"linkAsset" with args:
      | _id     | "DummyTemp/detached" |
      | assetId | "PERFO/unlinked"     |
    Then I should receive an error matching:
      | message | "Sensor \"DummyTemp/detached\" is not attached to a tenant" |
    When I execute the action "device-manager/sensor":"linkAsset" with args:
      | _id     | "DummyTemp/attached-ayse-unlinked" |
      | assetId | "PERFO/non-existing"               |
    Then I should receive an error matching:
      | message | "Asset \"PERFO/non-existing\" does not exist" |

  Scenario: Unlink sensor from an asset
    Given I successfully execute the action "device-manager/sensor":"linkAsset" with args:
      | _id     | "DummyTemp/attached-ayse-unlinked" |
      | assetId | "PERFO/unlinked"                   |
    When I successfully execute the action "device-manager/sensor":"unlink" with args:
      | _id | "DummyTemp/attached-ayse-unlinked" |
    Then The document "device-manager":"sensors":"DummyTemp/attached-ayse-unlinked" content match:
      | assetId | null |
    And The document "tenant-ayse":"assets":"PERFO/unlinked" content match:
      | measures | null |

  Scenario: Error when unlinking from an asset
    When I execute the action "device-manager/sensor":"unlink" with args:
      | _id | "DummyTemp/attached-ayse-unlinked" |
    Then I should receive an error matching:
      | message | "Sensor \"DummyTemp/attached-ayse-unlinked\" is not linked to an asset" |
