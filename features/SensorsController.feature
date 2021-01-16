Feature: Device Manager sensor controller

  Scenario: Assign a sensor to a tenant
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/sensors":"assign" with args:
      | _id      | "DummyTemp/unassigned" |
      | tenantId | "tenant-kuzzle"        |
    Then The document "device-manager":"sensors":"DummyTemp/unassigned" content match:
      | tenantId | "tenant-kuzzle" |
    And The document "tenant-kuzzle":"sensors":"DummyTemp/unassigned" exists

  Scenario: Error when assigning a sensor to a tenant
    Given an engine on index "tenant-kuzzle"
    When I execute the action "device-manager/sensors":"assign" with args:
      | _id      | "DummyTemp/unassigned" |
      | tenantId | "tenant-kaliop"         |
    Then I should receive an error matching:
      | message | "Tenant \"tenant-kaliop\" does not have a device-manager engine" |
    And I successfully execute the action "device-manager/sensors":"assign" with args:
      | _id      | "DummyTemp/unassigned" |
      | tenantId | "tenant-kuzzle"        |
    When I execute the action "device-manager/sensors":"assign" with args:
      | _id      | "DummyTemp/unassigned" |
      | tenantId | "tenant-kuzzle"        |
    Then I should receive an error matching:
      | message | "Sensor \"DummyTemp/unassigned\" is already assigned to a tenant" |

  Scenario: Unassign sensor from a tenant
    Given an engine on index "tenant-kuzzle"
    And I successfully execute the action "device-manager/sensors":"assign" with args:
      | _id      | "DummyTemp/unassigned" |
      | tenantId | "tenant-kuzzle"        |
    When I successfully execute the action "device-manager/sensors":"unassign" with args:
      | _id | "DummyTemp/unassigned" |
    Then The document "device-manager":"sensors":"DummyTemp/unassigned" content match:
      | tenantId | null |
    And The document "tenant-kuzzle":"sensors":"DummyTemp/unassigned" does not exists

  Scenario: Error when unassigning from a tenant
    Given an engine on index "tenant-kuzzle"
    When I execute the action "device-manager/sensors":"unassign" with args:
      | _id | "DummyTemp/unassigned" |
    Then I should receive an error matching:
      | message | "Sensor \"DummyTemp/unassigned\" is not assigned to a tenant" |
    Given I successfully execute the action "device-manager/sensors":"link" with args:
      | _id     | "DummyTemp/assigned-panja-unlinked" |
      | assetId | "PERFO/unlinked"                    |
    When I execute the action "device-manager/sensors":"unassign" with args:
      | _id | "DummyTemp/assigned-panja-unlinked" |
    Then I should receive an error matching:
      | message | "Sensor \"DummyTemp/assigned-panja-unlinked\" is still linked to an asset" |

  Scenario: Link sensor to an asset
    When I successfully execute the action "device-manager/sensors":"link" with args:
      | _id     | "DummyTemp/assigned-panja-unlinked" |
      | assetId | "PERFO/unlinked"                    |
    Then The document "device-manager":"sensors":"DummyTemp/assigned-panja-unlinked" content match:
      | assetId | "PERFO/unlinked" |
    And The document "tenant-panja":"sensors":"DummyTemp/assigned-panja-unlinked" content match:
      | assetId | "PERFO/unlinked" |
    And The document "tenant-panja":"assets":"PERFO/unlinked" content match:
      | measures.temperature.id               | "DummyTemp/assigned-panja-unlinked" |
      | measures.temperature.model            | "DummyTemp"                         |
      | measures.temperature.manufacturerId   | "assigned-panja-unlinked"           |
      | measures.temperature.updatedAt        | 1610793427950                       |
      | measures.temperature.payloadUuid      | "some-uuid"                         |
      | measures.temperature.value            | 23.3                                |
      | measures.temperature.metadata.battery | 80                                  |

  Scenario: Error when linking sensor to an asset
    When I execute the action "device-manager/sensors":"link" with args:
      | _id     | "DummyTemp/unassigned" |
      | assetId | "PERFO/unlinked"       |
    Then I should receive an error matching:
      | message | "Sensor \"DummyTemp/unassigned\" is not assigned to a tenant" |
    When I execute the action "device-manager/sensors":"link" with args:
      | _id     | "DummyTemp/assigned-panja-unlinked" |
      | assetId | "PERFO/non-existing"                |
    Then I should receive an error matching:
      | message | "Asset \"PERFO/non-existing\" does not exists" |

  Scenario: Unlink sensor from an asset
    Given I successfully execute the action "device-manager/sensors":"link" with args:
      | _id     | "DummyTemp/assigned-panja-unlinked" |
      | assetId | "PERFO/unlinked"                    |
    When I successfully execute the action "device-manager/sensors":"unlink" with args:
      | _id | "DummyTemp/assigned-panja-unlinked" |
    Then The document "device-manager":"sensors":"DummyTemp/assigned-panja-unlinked" content match:
      | assetId | null |
    And The document "tenant-panja":"sensors":"DummyTemp/assigned-panja-unlinked" does not exists
    And The document "tenant-panja":"assets":"PERFO/unlinked" content match:
      | measures | null |

  Scenario: Error when unlinking from an asset
    When I execute the action "device-manager/sensors":"unlink" with args:
      | _id | "DummyTemp/assigned-panja-unlinked" |
    Then I should receive an error matching:
      | message | "Sensor \"DummyTemp/assigned-panja-unlinked\" is not linked to an asset" |
