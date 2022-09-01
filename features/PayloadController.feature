Feature: Payloads Controller

  Scenario: Register a DummyTemp payload
    When I successfully receive a "dummy-temp" payload with:
      | deviceEUI  | "12345" |
      | register55 | 23.3    |
      | lvlBattery | 0.8     |
    And I refresh the collection "device-manager":"devices"
    Then The document "device-manager":"devices":"DummyTemp-12345" content match:
      | reference                      | "12345"           |
      | model                          | "DummyTemp"       |
      | measures[0].type               | "temperature"     |
      | measures[0].measuredAt         | "_DATE_NOW_"      |
      | measures[0].deviceMeasureName  | "temperature"     |
      | measures[0].values.temperature | 23.3              |
      | measures[0].origin.id          | "DummyTemp-12345" |
      | measures[0].origin.deviceModel | "DummyTemp"       |
      | measures[0].origin.type        | "device"          |
      | measures[0].unit.name          | "Degree"          |
      | measures[0].unit.sign          | "°"               |
      | measures[0].unit.type          | "number"          |
      | measures[1].type               | "battery"         |
      | measures[1].measuredAt         | "_DATE_NOW_"      |
      | measures[1].deviceMeasureName  | "theBatteryLevel" |
      | measures[1].values.battery     | 80                |
      | measures[1].origin.id          | "DummyTemp-12345" |
      | measures[1].origin.deviceModel | "DummyTemp"       |
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
    And I refresh the collection "device-manager":"devices"
    Then The document "device-manager":"devices":"DummyTemp-12345" content match:
      | reference                      | "12345"     |
      | model                          | "DummyTemp" |
      | measures[0].values.temperature | 42.2        |
      | measures[1].values.battery     | 70          |

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
    And I refresh the collection "device-manager":"devices"
    Then The document "device-manager":"devices":"DummyTempPosition-12345" content match:
      | reference                       | "12345"                   |
      | model                           | "DummyTempPosition"       |
      | measures[0].type                | "temperature"             |
      | measures[0].measuredAt          | "_DATE_NOW_"              |
      | measures[0].values.temperature  | 23.3                      |
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
    Given I successfully execute the action "device-manager/asset":"create" with args:
      | engineId       | "engine-kuzzle" |
      | body.type      | "type1"         |
      | body.reference | "reference1"    |
      | body.model     | "model1"        |
    And I successfully execute the action "device-manager/device":"attachEngine" with args:
      | _id      | "DummyMultiTemp-detached" |
      | engineId | "engine-kuzzle"           |
    And I refresh the collection "engine-ayse":"assets"
    And I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id      | "DummyMultiTemp-detached" |
      | assetId  | "type1-model1-reference1" |
      | engineId | "engine-kuzzle"           |
    When I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI     | "detached" |
      | payloads[0].registerInner | 42.2       |
      | payloads[0].lvlBattery    | 0.4        |
    And I refresh the collection "engine-kuzzle":"measures"
    Then When I successfully execute the action "document":"search" with args:
      | index      | "engine-kuzzle" |
      | collection | "measures"      |
    And I should receive a "hits" array of objects matching:
      | _source.type  | _source.origin.id         | _source.origin.assetId    | _source.origin.type |
      | "temperature" | "DummyMultiTemp-detached" | "type1-model1-reference1" | "device"            |
      | "battery"     | "DummyMultiTemp-detached" | "type1-model1-reference1" | "device"            |

  Scenario: Receive a Payload from a know and an unknow device and verify payload documents
    When I successfully execute the following HTTP request:
      | method            | "post"                                 |
      | path              | "/_/device-manager/payload/dummy-temp" |
      | body.deviceEUI    | "777"                                  |
      | body.temperature  | 3                                      |
      | body.batteryLevel | 14                                     |
    Then The document "device-manager":"devices":"DummyTemp-777" content match:
      | reference | "777"       |
      | model     | "DummyTemp" |
    When I refresh the collection "device-manager":"payloads"
    Then I successfully execute the action "document":"search" with args:
      | index            | "device-manager"             |
      | collection       | "payloads"                   |
      | body.query.match | {"payload.deviceEUI" :"777"} |
    And I should receive a result matching:
      | hits | [{_source : {deviceModel : "DummyTemp", payload : { deviceEUI : "777", temperature : 3}}}] |
    When I successfully execute the following HTTP request:
      | method            | "post"                                   |
      | path              | "/_/device-manager/payload/unknowDevice" |
      | body.deviceEUI    | "666"                                    |
      | body.temperature  | 6                                        |
      | body.batteryLevel | 66                                       |
    And I refresh the collection "device-manager":"payloads"
    And I successfully execute the action "document":"search" with args:
      | index            | "device-manager"              |
      | collection       | "payloads"                    |
      | body.query.match | {deviceModel :"unknowDevice"} |
    Then I should receive a result matching:
      | hits | [{_source : {deviceModel : "unknowDevice", rawPayload : { deviceEUI : "666", temperature : 6}}}] |

  Scenario: Enrich a measure for a device linked to an asset with asset info
    Given I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI     | "enrich_me_master" |
      | payloads[0].registerInner | 42.2               |
      | payloads[0].lvlBattery    | 0.4                |
    Given I successfully execute the action "device-manager/device":"attachEngine" with args:
      | _id      | "DummyMultiTemp-enrich_me_master" |
      | engineId | "engine-ayse"                     |
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id      | "DummyMultiTemp-enrich_me_master" |
      | assetId  | "container-FRIDGE-unlinked_1"     |
      | engineId | "engine-ayse"                     |
    When I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI     | "enrich_me_master" |
      | payloads[0].registerInner | 21.1               |
      | payloads[0].lvlBattery    | 0.8                |
    And I refresh the collection "engine-ayse":"measures"
    Then When I successfully execute the action "document":"search" with args:
      | index      | "engine-ayse"                                                      |
      | collection | "measures"                                                         |
      | body       | { query: { term:{"origin.assetId":"container-FRIDGE-unlinked_1"}}} |
    And I should receive a "hits" array of objects matching:
      | _source.type  | _source.origin.id                                             |
      | "temperature" | "DummyMultiTemp-enrich_me_master+container-FRIDGE-unlinked_1" |
      | "battery"     | "DummyMultiTemp-enrich_me_master+container-FRIDGE-unlinked_1" |
    Then The document "device-manager":"devices":"DummyMultiTemp-enrich_me_master" content match:
      | measures[0].origin.id | "DummyMultiTemp-enrich_me_master+container-FRIDGE-unlinked_1" |
      | measures[1].origin.id | "DummyMultiTemp-enrich_me_master+container-FRIDGE-unlinked_1" |
    Then The document "engine-ayse":"devices":"DummyMultiTemp-enrich_me_master" content match:
      | measures[0].origin.id | "DummyMultiTemp-enrich_me_master+container-FRIDGE-unlinked_1" |
      | measures[1].origin.id | "DummyMultiTemp-enrich_me_master+container-FRIDGE-unlinked_1" |
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | measures[0].origin.id | "DummyMultiTemp-enrich_me_master+container-FRIDGE-unlinked_1" |
      | measures[1].origin.id | "DummyMultiTemp-enrich_me_master+container-FRIDGE-unlinked_1" |

