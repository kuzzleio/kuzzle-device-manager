Feature: Payloads Controller

  Scenario: Register a DummyTemp payload
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345" |
      | register55   | 23.3    |
      | batteryLevel | 0.8     |
    Then The document "device-manager":"devices":"DummyTemp-12345" content match:
      | reference                        | "12345"       |
      | model                            | "DummyTemp"   |
      | measures.temperature.updatedAt   | "_DATE_NOW_"  |
      | measures.temperature.payloadUuid | "_STRING_"    |
      | measures.temperature.degree      | 23.3          |
      | qos.battery                      | 80            |
      | tenantId                         | "_UNDEFINED_" |
      | assetId                          | "_UNDEFINED_" |

  Scenario: Update a DummyTemp payload
    Given I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345" |
      | register55   | 23.3    |
      | batteryLevel | 0.8     |
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345" |
      | register55   | 42.2    |
      | batteryLevel | 0.7     |
    Then The document "device-manager":"devices":"DummyTemp-12345" content match:
      | reference                        | "12345"       |
      | model                            | "DummyTemp"   |
      | measures.temperature.updatedAt   | "_DATE_NOW_"  |
      | measures.temperature.payloadUuid | "_STRING_"    |
      | measures.temperature.degree      | 42.2          |
      | qos.battery                      | 70            |
      | tenantId                         | "_UNDEFINED_" |
      | assetId                          | "_UNDEFINED_" |

  Scenario: Reject with error a DummyTemp payload
    When I receive a "dummy-temp" payload with:
      | deviceEUI    | null |
      | register55   | 42.2 |
      | batteryLevel | 0.7  |
    Then I should receive an error matching:
      | message | "Invalid payload: missing \"deviceEUI\"" |

  Scenario: Reject a DummyTemp payload
    When I receive a "dummy-temp" payload with:
      | deviceEUI    | "4242" |
      | invalid      | true   |
      | register55   | 42.2   |
      | batteryLevel | 0.7    |
    Then The document "device-manager":"devices":"DummyTemp-4242" does not exists

  Scenario: Receive a payload with 2 measures
    When I successfully receive a "dummy-temp-position" payload with:
      | deviceEUI     | "12345" |
      | register55    | 23.3    |
      | location.lat  | 42.2    |
      | location.lon  | 2.42    |
      | location.accu | 2100    |
    Then The document "device-manager":"devices":"DummyTempPosition-12345" content match:
      | reference                        | "12345"             |
      | model                            | "DummyTempPosition" |
      | measures.temperature.updatedAt   | "_DATE_NOW_"        |
      | measures.temperature.payloadUuid | "_STRING_"          |
      | measures.temperature.degree      | 23.3                |
      | measures.position.updatedAt      | "_DATE_NOW_"        |
      | measures.position.payloadUuid    | "_STRING_"          |
      | measures.position.point.lat      | 42.2                |
      | measures.position.point.lon      | 2.42                |
      | measures.position.accuracy       | 2100                |
      | qos.battery                      | 80                  |
      | tenantId                         | "_UNDEFINED_"       |
      | assetId                          | "_UNDEFINED_"       |

  Scenario: Enrich tag with beforeRegister and beforeUpdate hooks
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345" |
      | register55   | 23.3    |
      | batteryLevel | 0.8     |
    Then The document "device-manager":"devices":"DummyTemp-12345" content match:
      | qos.registerEnriched | true          |
      | qos.updateEnriched   | "_UNDEFINED_" |
    # Update
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345" |
      | register55   | 23.3    |
      | batteryLevel | 0.8     |
    Then The document "device-manager":"devices":"DummyTemp-12345" content match:
      | qos.registerEnriched | true |
      | qos.updateEnriched   | true |

  Scenario: Execute afterRegister and afterUpdate hooks
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345" |
      | register55   | 23.3    |
      | batteryLevel | 0.8     |
    Then I should receive a result matching:
      | afterRegister | true |
    # Update
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345" |
      | register55   | 23.3    |
      | batteryLevel | 0.8     |
    Then I should receive a result matching:
      | afterUpdate | true |

  Scenario: Propagate device measure to tenant index
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "attached_ayse_unlinked" |
      | register55   | 42.2                     |
      | batteryLevel | 0.4                      |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | tenantId                         | "tenant-ayse" |
      | measures.temperature.updatedAt   | "_DATE_NOW_"  |
      | measures.temperature.payloadUuid | "_STRING_"    |
      | measures.temperature.degree      | 42.2          |
      | qos.battery                      | 40            |
    And The document "tenant-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | tenantId                         | "tenant-ayse" |
      | measures.temperature.updatedAt   | "_DATE_NOW_"  |
      | measures.temperature.payloadUuid | "_STRING_"    |
      | measures.temperature.degree      | 42.2          |
      | qos.battery                      | 40            |
    And I should receive a result matching:
      | device._id | "DummyTemp-attached_ayse_unlinked" |
      | asset      | null                               |
      | tenantId   | "tenant-ayse"                      |

  Scenario: Propagate device measures to asset
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "attached_ayse_linked" |
      | register55   | 42.2                   |
      | batteryLevel | 0.4                    |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_linked" content match:
      | tenantId | "tenant-ayse" |
      | assetId  | "MART-linked" |
    Then The document "tenant-ayse":"devices":"DummyTemp-attached_ayse_linked" content match:
      | tenantId | "tenant-ayse" |
      | assetId  | "MART-linked" |
    And The document "tenant-ayse":"assets":"MART-linked" content match:
      | measures.temperature.id          | "DummyTemp-attached_ayse_linked" |
      | measures.temperature.reference   | "attached_ayse_linked"           |
      | measures.temperature.model       | "DummyTemp"                      |
      | measures.temperature.updatedAt   | "_DATE_NOW_"                     |
      | measures.temperature.payloadUuid | "_STRING_"                       |
      | measures.temperature.degree      | 42.2                             |
      | measures.temperature.qos.battery | 40                               |
      # Enriched with the event
      | metadata.enriched                | true                             |
      | metadata.assetId                 | "MART-linked"                    |
    And I should receive a result matching:
      | device._id | "DummyTemp-attached_ayse_linked" |
      | asset._id  | "MART-linked"                    |
      | tenantId   | "tenant-ayse"                    |

  Scenario: Use event to enrich the asset and historize it
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "attached_ayse_linked" |
      | register55   | 51.1                   |
      | batteryLevel | 0.42                   |
    And I refresh the collection "tenant-ayse":"assets-history"
    And The last document from "tenant-ayse":"assets-history" content match:
      | assetId                 | "MART-linked"   |
      | measureTypes            | ["temperature"] |
      | assetId                 | "MART-linked"   |
      | asset.model             | "MART"          |
      | asset.reference         | "linked"        |
      | asset.metadata.enriched | true            |
      | asset.metadata.assetId  | "MART-linked"   |
