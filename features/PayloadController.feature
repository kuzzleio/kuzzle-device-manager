Feature: Payloads Controller

  Scenario: Register a DummyTemp payload
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345"     |
      | register55   | 23.3        |
      | batteryLevel | 0.8         |
      | uuid         | "some-uuid" |
    Then The document "device-manager":"sensors":"DummyTemp/12345" content match:
      | manufacturerId                   | "12345"       |
      | model                            | "DummyTemp"   |
      | measures.temperature.updatedAt   | "_DATE_NOW_"  |
      | measures.temperature.payloadUuid | "some-uuid"   |
      | measures.temperature.value       | 23.3          |
      | metadata.battery                 | 80            |
      | tenantId                         | "_UNDEFINED_" |
      | assetId                          | "_UNDEFINED_" |

  Scenario: Update a DummyTemp payload
    Given I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345"     |
      | register55   | 23.3        |
      | batteryLevel | 0.8         |
      | uuid         | "some-uuid" |
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345"           |
      | register55   | 42.2              |
      | batteryLevel | 0.7               |
      | uuid         | "some-other-uuid" |
    Then The document "device-manager":"sensors":"DummyTemp/12345" content match:
      | manufacturerId                   | "12345"           |
      | model                            | "DummyTemp"       |
      | measures.temperature.updatedAt   | "_DATE_NOW_"      |
      | measures.temperature.payloadUuid | "some-other-uuid" |
      | measures.temperature.value       | 42.2              |
      | metadata.battery                 | 70                |
      | tenantId                         | "_UNDEFINED_"     |
      | assetId                          | "_UNDEFINED_"     |

  Scenario: Validate a DummyTemp payload
    When I receive a "dummy-temp" payload with:
      | deviceEUI    | null              |
      | register55   | 42.2              |
      | batteryLevel | 0.7               |
      | uuid         | "some-other-uuid" |
    Then I should receive an error matching:
      | message | "Invalid payload: missing \"deviceEUI\"" |


  Scenario: Receive a payload with 2 measures
    When I successfully receive a "dummy-temp-position" payload with:
      | deviceEUI     | "12345"     |
      | register55    | 23.3        |
      | location.lat  | 42.2        |
      | location.lon  | 2.42        |
      | location.accu | 2100        |
      | batteryLevel  | 0.8         |
      | uuid          | "some-uuid" |
    Then The document "device-manager":"sensors":"DummyTempPosition/12345" content match:
      | manufacturerId                   | "12345"             |
      | model                            | "DummyTempPosition" |
      | measures.temperature.updatedAt   | "_DATE_NOW_"        |
      | measures.temperature.payloadUuid | "some-uuid"         |
      | measures.temperature.value       | 23.3                |
      | measures.position.updatedAt      | "_DATE_NOW_"        |
      | measures.position.payloadUuid    | "some-uuid"         |
      | measures.position.latitude       | 42.2                |
      | measures.position.longitude      | 2.42                |
      | measures.position.accuracy       | 2100                |
      | metadata.battery                 | 80                  |
      | tenantId                         | "_UNDEFINED_"       |
      | assetId                          | "_UNDEFINED_"       |

  Scenario: Enrich tag with beforeRegister and beforeUpdate hooks
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345"     |
      | register55   | 23.3        |
      | batteryLevel | 0.8         |
      | uuid         | "some-uuid" |
    Then The document "device-manager":"sensors":"DummyTemp/12345" content match:
      | metadata.registerEnriched | true          |
      | metadata.updateEnriched   | "_UNDEFINED_" |
    # Update
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345"     |
      | register55   | 23.3        |
      | batteryLevel | 0.8         |
      | uuid         | "some-uuid" |
    Then The document "device-manager":"sensors":"DummyTemp/12345" content match:
      | metadata.registerEnriched | true |
      | metadata.updateEnriched   | true |

  Scenario: Execute afterRegister and afterUpdate hooks
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345"     |
      | register55   | 23.3        |
      | batteryLevel | 0.8         |
      | uuid         | "some-uuid" |
    Then I should receive a result matching:
      | afterRegister | true |
    # Update
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345"     |
      | register55   | 23.3        |
      | batteryLevel | 0.8         |
      | uuid         | "some-uuid" |
    Then I should receive a result matching:
      | afterUpdate | true |

  Scenario: Propagate sensor to tenant index
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "assigned-panja-unlinked" |
      | register55   | 42.2                      |
      | batteryLevel | 0.4                       |
      | uuid         | "some-other-uuid"         |
    Then The document "device-manager":"sensors":"DummyTemp/assigned-panja-unlinked" content match:
      | tenantId                         | "tenant-panja"    |
      | measures.temperature.updatedAt   | "_DATE_NOW_"      |
      | measures.temperature.payloadUuid | "some-other-uuid" |
      | measures.temperature.value       | 42.2              |
      | metadata.battery                 | 40                |
    And The document "tenant-panja":"sensors":"DummyTemp/assigned-panja-unlinked" content match:
      | tenantId                         | "tenant-panja"    |
      | measures.temperature.updatedAt   | "_DATE_NOW_"      |
      | measures.temperature.payloadUuid | "some-other-uuid" |
      | measures.temperature.value       | 42.2              |
      | metadata.battery                 | 40                |
    And I refresh the collection "tenant-panja":"sensors-history"
    And I count 1 documents in "tenant-panja":"sensors-history"

  Scenario: Propagate sensor measures to asset
    Given I successfully execute the action "device-manager/sensor":"link" with args:
      | _id     | "DummyTemp/assigned-panja-unlinked" |
      | assetId | "PERFO/unlinked"                    |
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "assigned-panja-unlinked" |
      | register55   | 42.2                      |
      | batteryLevel | 0.4                       |
      | uuid         | "some-other-uuid"         |
    Then The document "device-manager":"sensors":"DummyTemp/assigned-panja-unlinked" content match:
      | tenantId | "tenant-panja"   |
      | assetId  | "PERFO/unlinked" |
    Then The document "tenant-panja":"sensors":"DummyTemp/assigned-panja-unlinked" content match:
      | tenantId | "tenant-panja"   |
      | assetId  | "PERFO/unlinked" |
    And The document "tenant-panja":"assets":"PERFO/unlinked" content match:
      | measures.temperature.id               | "DummyTemp/assigned-panja-unlinked" |
      | measures.temperature.manufacturerId   | "assigned-panja-unlinked"           |
      | measures.temperature.model            | "DummyTemp"                         |
      | measures.temperature.updatedAt        | "_DATE_NOW_"                        |
      | measures.temperature.payloadUuid      | "some-other-uuid"                   |
      | measures.temperature.value            | 42.2                                |
      | measures.temperature.metadata.battery | 40                                  |

