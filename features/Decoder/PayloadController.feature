Feature: Payloads Controller

  Scenario: Register a DummyTemp payload
    Given I send the following "dummy-temp" payloads:
      | deviceEUI | temperature |
      | "12345"   | 21          |
      | "12345"   | 42          |
    Then The document "device-manager":"devices":"DummyTemp-12345" content match:
      | reference                      | "12345"           |
      | model                          | "DummyTemp"       |
      | measures[0].type               | "temperature"     |
      | measures[0].measuredAt         | "_DATE_NOW_"      |
      | measures[0].deviceMeasureName  | "temperature"     |
      | measures[0].values.temperature | 42                |
      | measures[0].origin.id          | "DummyTemp-12345" |
      | measures[0].origin.deviceModel | "DummyTemp"       |
      | measures[0].origin.type        | "device"          |
      | measures[0].unit.name          | "Degree"          |
      | measures[0].unit.sign          | "°"               |
      | measures[0].unit.type          | "number"          |
      | engineId                       | "_UNDEFINED_"     |
      | assetId                        | "_UNDEFINED_"     |

  Scenario: Reject with error a DummyTemp payload
    Given I try to send the following "dummy-temp" payloads:
      | deviceEUI | temperature |
      | null      | 21          |
    Then I should receive an error matching:
      | message | "Invalid payload: missing \"deviceEUI\"" |

  Scenario: Reject a DummyTemp payload
    Given I send the following "dummy-temp" payloads:
      | deviceEUI | temperature | invalid |
      | "12345"   | 21          | true    |
    Then I should receive a result matching:
      | valid | false |
    And The document "device-manager":"devices":"DummyTemp-12345" does not exists

  Scenario: Receive a payload with 3 measures
    Given I send the following "dummy-temp-position" payloads:
      | deviceEUI | temperature | location.lat | location.lon | location.accuracy | battery |
      | "12345"   | 21          | 42.2         | 2.42         | 2100              | 0.8     |
    Then The document "device-manager":"devices":"DummyTempPosition-12345" content match:
      | reference                       | "12345"                   |
      | model                           | "DummyTempPosition"       |
      | measures[0].type                | "temperature"             |
      | measures[0].measuredAt          | "_DATE_NOW_"              |
      | measures[0].values.temperature  | 21                        |
      | measures[0].origin.id           | "DummyTempPosition-12345" |
      | measures[0].origin.deviceModel  | "DummyTempPosition"       |
      | measures[0].origin.type         | "device"                  |
      | measures[0].origin.assetId      | "_UNDEFINED_"             |
      | measures[0].unit.name           | "Degree"                  |
      | measures[0].unit.sign           | "°"                       |
      | measures[0].unit.type           | "number"                  |
      | measures[1].type                | "position"                |
      | measures[1].measuredAt          | "_DATE_NOW_"              |
      | measures[1].values.position.lat | 42.2                      |
      | measures[1].values.position.lon | 2.42                      |
      | measures[1].values.accuracy     | 2100                      |
      | measures[1].origin.id           | "DummyTempPosition-12345" |
      | measures[1].origin.deviceModel  | "DummyTempPosition"       |
      | measures[1].origin.type         | "device"                  |
      | measures[1].unit.name           | "GPS"                     |
      | measures[1].unit.sign           | "_NULL_"                  |
      | measures[1].unit.type           | "geo_point"               |
      | measures[2].type                | "battery"                 |
      | measures[2].measuredAt          | "_DATE_NOW_"              |
      | measures[2].values.battery      | 80                        |
      | measures[2].origin.id           | "DummyTempPosition-12345" |
      | measures[2].origin.deviceModel  | "DummyTempPosition"       |
      | measures[2].origin.type         | "device"                  |
      | measures[2].unit.name           | "Volt"                    |
      | measures[2].unit.sign           | "v"                       |
      | measures[2].unit.type           | "number"                  |
      | engineId                        | "_UNDEFINED_"             |
      | assetId                         | "_UNDEFINED_"             |

  Scenario: Historize the measures with deviceId and assetId
    Given I send the following "dummy-temp" payloads:
      | deviceEUI | "12345" |
      | "linked1" | 42.2    |
    And I refresh the collection "engine-ayse":"measures"
    Then When I successfully execute the action "document":"search" with args:
      | index      | "engine-ayse" |
      | collection | "measures"    |
    And I should receive a "hits" array of objects matching:
      | _source.type  | _source.origin.id   | _source.asset.id    | _source.origin.type |
      | "temperature" | "DummyTemp-linked1" | "container-linked1" | "device"            |

  Scenario: Decode Device metadata from payload
    Given I send the following "dummy-temp" payloads:
      | deviceEUI | temperature | metadata.color |
      | "12345"   | 21.1        | "RED"          |
    Then The formatted document "device-manager":"devices":"DummyTemp-12345" content match:
      | reference      | "12345"     |
      | model          | "DummyTemp" |
      | metadata.color | "RED"       |

  Scenario: Throw an error when decoding unknown measure name
    Given I successfully execute the action "device-manager/devices":"create" with args:
      | engineId       | "device-manager" |
      | body.model     | "DummyTemp"      |
      | body.reference | "test"           |
    When I try to send the following "dummy-temp" payloads:
      | deviceEUI | temperature | unknownMeasure |
      | "12345"   | 21.1        | 42             |
    Then I should receive an error matching:
      | message | "Decoder \"DummyTemp\" has no measure named \"unknownMeasureName\"" |
    Then The document "device-manager":"devices":"DummyTemp-test" content match:
      | measures | [] |
