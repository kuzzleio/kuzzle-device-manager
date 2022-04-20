Feature: Payloads Controller

  Scenario: Register a DummyTemp payload
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345" |
      | register55   | 23.3    |
      | batteryLevel | 0.8     |
    Then The document "device-manager":"devices":"DummyTemp-12345" content match:
      | reference                      | "12345"           |
      | model                          | "DummyTemp"       |
      | measures[0].type               | "temperature"     |
      | measures[0].measuredAt         | "_DATE_NOW_"      |
      | measures[0].values.temperature | 23.3              |
      | measures[0].origin.id          | "DummyTemp-12345" |
      | measures[0].origin.model       | "DummyTemp"       |
      | measures[0].origin.type        | "device"          |
      | measures[0].unit.name          | "Degree"          |
      | measures[0].unit.sign          | "°"               |
      | measures[0].unit.type          | "number"          |
      | measures[1].type               | "battery"         |
      | measures[1].measuredAt         | "_DATE_NOW_"      |
      | measures[1].values.battery     | 80                |
      | measures[1].origin.id          | "DummyTemp-12345" |
      | measures[1].origin.model       | "DummyTemp"       |
      | measures[1].origin.type        | "device"          |
      | measures[1].unit.name          | "Volt"            |
      | measures[1].unit.sign          | "v"               |
      | measures[1].unit.type          | "number"          |
      | engineId                       | "_UNDEFINED_"     |
      | assetId                        | "_UNDEFINED_"     |

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
      | reference                      | "12345"       |
      | model                          | "DummyTemp"   |
      | measures[0].values.temperature | 42.2          |
      | measures[1].values.battery     | 70            |
      | engineId                       | "_UNDEFINED_" |
      | assetId                        | "_UNDEFINED_" |

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
    Then I should receive a result matching:
      | valid | false |
    And The document "device-manager":"devices":"DummyTemp-4242" does not exists

  Scenario: Receive a payload with 3 measures
    When I successfully receive a "dummy-temp-position" payload with:
      | deviceEUI     | "12345" |
      | register55    | 23.3    |
      | location.lat  | 42.2    |
      | location.lon  | 2.42    |
      | location.accu | 2100    |
    Then The document "device-manager":"devices":"DummyTempPosition-12345" content match:
      | reference                       | "12345"                   |
      | model                           | "DummyTempPosition"       |
      | measures[0].type                | "temperature"             |
      | measures[0].measuredAt          | "_DATE_NOW_"              |
      | measures[0].values.temperature  | 23.3                      |
      | measures[0].origin.id           | "DummyTempPosition-12345" |
      | measures[0].origin.model        | "DummyTempPosition"       |
      | measures[0].origin.type         | "device"                  |
      | measures[0].origin.assetId      | null                      |
      | measures[0].unit.name           | "Degree"                  |
      | measures[0].unit.sign           | "°"                       |
      | measures[0].unit.type           | "number"                  |
      | measures[1].type                | "position"                |
      | measures[1].measuredAt          | "_DATE_NOW_"              |
      | measures[1].values.position.lat | 42.2                      |
      | measures[1].values.position.lon | 2.42                      |
      | measures[1].values.accuracy     | 2100                      |
      | measures[1].origin.id           | "DummyTempPosition-12345" |
      | measures[1].origin.model        | "DummyTempPosition"       |
      | measures[1].origin.type         | "device"                  |
      | measures[1].unit.name           | "GPS"                     |
      | measures[1].unit.sign           | "_NULL_"                  |
      | measures[1].unit.type           | "geo_point"               |
      | measures[2].type                | "battery"                 |
      | measures[2].measuredAt          | "_DATE_NOW_"              |
      | measures[2].values.battery      | 80                        |
      | measures[2].origin.id           | "DummyTempPosition-12345" |
      | measures[2].origin.model        | "DummyTempPosition"       |
      | measures[2].origin.type         | "device"                  |
      | measures[2].unit.name           | "Volt"                    |
      | measures[2].unit.sign           | "v"                       |
      | measures[2].unit.type           | "number"                  |
      | engineId                        | "_UNDEFINED_"             |
      | assetId                         | "_UNDEFINED_"             |

  Scenario: Propagate device measure to engine index
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "attached_ayse_unlinked" |
      | register55   | 42.2                     |
      | batteryLevel | 0.4                      |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | engineId                       | "engine-ayse"              |
      | measures[0].values.temperature | 42.2                       |
      | measures[1].values.battery     | 40                         |
      # Enriched with the event "engine:engine-ayse:device:measures:new"
      | metadata.enriched              | true                       |
      | metadata.measureTypes          | ["temperature", "battery"] |
    And The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | engineId                       | "engine-ayse"              |
      | measures[0].values.temperature | 42.2                       |
      | measures[1].values.battery     | 40                         |
      # Enriched with the event "engine:engine-ayse:device:measures:new"
      | metadata.enriched              | true                       |
      | metadata.measureTypes          | ["temperature", "battery"] |
    And I should receive a result matching:
      | device._id | "DummyTemp-attached_ayse_unlinked" |
      | asset      | null                               |
      | engineId   | "engine-ayse"                      |

  Scenario: Propagate device measures to asset
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "attached_ayse_linked" |
      | register55   | 42.2                   |
      | batteryLevel | 0.4                    |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_linked" content match:
      | engineId | "engine-ayse"       |
      | assetId  | "tools-MART-linked" |
    Then The document "engine-ayse":"devices":"DummyTemp-attached_ayse_linked" content match:
      | engineId | "engine-ayse"       |
      | assetId  | "tools-MART-linked" |
    And The document "engine-ayse":"assets":"tools-MART-linked" content match:
      | measures[0].type               | "temperature"                    |
      | measures[0].measuredAt         | "_DATE_NOW_"                     |
      | measures[0].values.temperature | 42.2                             |
      | measures[0].origin.id          | "DummyTemp-attached_ayse_linked" |
      | measures[0].origin.model       | "DummyTemp"                      |
      | measures[0].origin.type        | "device"                         |
      | measures[0].unit.name          | "Degree"                         |
      | measures[0].unit.sign          | "°"                              |
      | measures[0].unit.type          | "number"                         |
      | measures[1].type               | "battery"                        |
      | measures[1].measuredAt         | "_DATE_NOW_"                     |
      | measures[1].values.battery     | 40                               |
      | measures[1].origin.id          | "DummyTemp-attached_ayse_linked" |
      | measures[1].origin.model       | "DummyTemp"                      |
      | measures[1].origin.assetId     | "tools-MART-linked"              |
      | measures[1].origin.type        | "device"                         |
      | measures[1].unit.name          | "Volt"                           |
      | measures[1].unit.sign          | "v"                              |
      | measures[1].unit.type          | "number"                         |
      # Enriched with the event "engine:engine-ayse:asset:measures:new"
      | metadata.enriched              | true                             |
      | metadata.measureTypes          | ["temperature", "battery"]       |
    And I should receive a result matching:
      | device._id | "DummyTemp-attached_ayse_linked" |
      | asset._id  | "tools-MART-linked"              |
      | engineId   | "engine-ayse"                    |

  Scenario: Historize the measures
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "attached_ayse_linked" |
      | register55   | 42.2                   |
      | batteryLevel | 0.4                    |
    And I refresh the collection "engine-ayse":"measures"
    Then When I successfully execute the action "document":"search" with args:
      | index      | "engine-ayse" |
      | collection | "measures"    |
    And I should receive a "hits" array of objects matching:
      | _source.type  | _source.origin.assetId |
      | "temperature" | "tools-MART-linked"    |
      | "battery"     | "tools-MART-linked"    |

