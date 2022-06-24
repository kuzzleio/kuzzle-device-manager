Feature: DeviceManager asset controller

  Scenario: Create, update and delete an asset
    When I successfully execute the action "device-manager/asset":"create" with args:
      | engineId       | "engine-kuzzle" |
      | body.type      | "outils"        |
      | body.model     | "PERFO"         |
      | body.reference | "asset_01"      |
    Then The document "engine-kuzzle":"assets":"outils-PERFO-asset_01" exists
    When I successfully execute the action "device-manager/asset":"update" with args:
      | engineId             | "engine-kuzzle"         |
      | _id                  | "outils-PERFO-asset_01" |
      | body.metadata.foobar | 42                      |
      | body.metadata.index  | "engine-kuzzle"         |
    And I successfully execute the action "device-manager/asset":"delete" with args:
      | engineId | "engine-kuzzle"         |
      | _id      | "outils-PERFO-asset_01" |
    Then The document "engine-kuzzle":"assets":"outils-PERFO-asset_01" does not exists

  Scenario: Delete a linked asset
    When I successfully execute the action "device-manager/asset":"create" with args:
      | engineId       | "engine-ayse" |
      | body.type      | "outils"      |
      | body.model     | "PERFO"       |
      | body.reference | "asset_02"    |
    And I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id                     | "DummyMultiTemp-attached_ayse_unlinked_1"  |
      | assetId                 | "outils-PERFO-asset_02"             |
      | body.metadata.index     | "engine-ayse"         |
      | body.measureNamesLinks  | [ { assetMeasureName: "coreBattery", deviceMeasureName: "theBattery" }, { assetMeasureName: "motorTemp", deviceMeasureName: "theTemperature" } ] |
    And I successfully execute the action "device-manager/asset":"delete" with args:
      | engineId | "engine-ayse"         |
      | _id      | "outils-PERFO-asset_02" |
    Then The document "engine-ayse":"assets":"outils-PERFO-asset_02" does not exist:
    And The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | null |
    And The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | null |

  Scenario: Import assets using csv
    When I successfully execute the action "device-manager/asset":"importAssets" with args:
      | engineId | "engine-kuzzle"                                |
      | body.csv | "reference,model,type\\nimported,PERFO,outils" |
    Then I successfully execute the action "collection":"refresh" with args:
      | index      | "engine-kuzzle" |
      | collection | "assets"        |
    Then The document "engine-kuzzle":"assets":"outils-PERFO-imported" content match:
      | reference | "imported" |
      | model     | "PERFO"    |

  Scenario: Retrieve asset measures history
    Given I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI    | "attached_ayse_linked_1" |
      | payloads[0].register1    | 42.2                     |
    And I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI    | "attached_ayse_linked_1" |
      | payloads[0].register1    | 42.1                     |
    And I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI    | "attached_ayse_linked_1" |
      | payloads[0].register1    | 42.0                     |
    And I refresh the collection "engine-ayse":"measures"
    When I successfully execute the action "device-manager/asset":"getMeasures" with args:
      | engineId | "engine-ayse"              |
      | _id      | "container-FRIDGE-linked"  |
      | size     | 3                          |
    Then I should receive a "measures" array of objects matching:
    # there is 6 measures with the 3 from fixtures
      | _source.origin.assetId    | _source.origin.id                        |
      | "container-FRIDGE-linked" | "DummyMultiTemp-attached_ayse_linked_1"  |
      | "container-FRIDGE-linked" | "DummyMultiTemp-attached_ayse_linked_1"  |
      | "container-FRIDGE-linked" | "DummyMultiTemp-attached_ayse_linked_1"  |

  Scenario: Register a measures in the asset, an other with different name and an older one and delete one
    When I successfully execute the action "device-manager/asset":"pushMeasures" with args:
      | engineId  | "engine-ayse"               |
      | _id       | "container-FRIDGE-unlinked_1" |
      | body      | { "measures": [ { "values": { "temperature": 70 }, "type": "temperature", "assetMeasureName": "leftOuterTemp" }, { "values": { "nothing": null }, "type": "nonValidType" } ] } |
    Then I should receive a result matching:
      | engineId  | "engine-ayse"                                                 |
      | invalids  | [ { "values": { "nothing": null }, "type": "nonValidType" } ] |
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | measures | [ { "type": "temperature", "deviceMeasureName": null, "assetMeasureName": "leftOuterTemp", "values": { "temperature": 70 }, "origin": { "type": "asset" } } ] |
    When I successfully execute the action "device-manager/asset":"pushMeasures" with args:
      | engineId  | "engine-ayse"             |
      | _id       | "container-FRIDGE-unlinked_1" |
      | body      | { "measures": [ { "values": { "temperature": -3 }, "type": "temperature", "assetMeasureName": "leftInnerTemp" }, { "values": { "nothing": null }, "type": "nonValidType" } ] } |
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | measures | [ { "assetMeasureName": "leftOuterTemp", "values": { "temperature": 70 } }, { "assetMeasureName": "leftInnerTemp", "values": { "temperature": -3 } } ] |
    When I successfully execute the action "device-manager/asset":"pushMeasures" with args:
      | engineId  | "engine-ayse"             |
      | _id       | "container-FRIDGE-unlinked_1" |
      | body      | { "measures": [ { "measuredAt": 1, "values": { "temperature": 98 }, "type": "temperature", "assetMeasureName": "leftOuterTemp" } ] } |
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | measures | [ { "assetMeasureName": "leftOuterTemp", "values": { "temperature": 70 } }, { "assetMeasureName": "leftInnerTemp", "values": { "temperature": -3 } } ] |
    And I refresh the collection "engine-ayse":"measures"
    # 9 Existing measures from fixtures
    And I count 12 documents in "engine-ayse":"measures"
    When I successfully execute the action "device-manager/asset":"removeMeasure" with args:
      | engineId                    | "engine-ayse"               |
      | _id                         | "container-FRIDGE-unlinked_1" |
      | assetMeasureName            | "leftOuterTemp"             |
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | measures | [ { "assetMeasureName": "leftInnerTemp", "values": { "temperature": -3 } } ] |

  Scenario: Get payloads from devices and register correctly
    When I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI    | "attached_ayse_linked_1"   |
      | payloads[0].register1    | -10                        |
      | payloads[0].register2    | 30                         |
      | payloads[0].lvlBattery   | 0.9                        |
      | payloads[1].deviceEUI    | "attached_ayse_linked_2"   |
      | payloads[1].register1    | -20                        |
      | payloads[1].register2    | 40                         |
    Then The document "engine-ayse":"assets":"container-FRIDGE-linked" content match:
      | measures[0].assetMeasureName    | "coreBatteryLevel"  |
      | measures[0].values.battery      | 90                  |
      | measures[1].assetMeasureName    | "leftOuterTemp"     |
      | measures[1].values.temperature  | 30                  |
      | measures[2].assetMeasureName    | "leftInnerTemp"     | 
      | measures[2].values.temperature  | -10                 |
      | measures[3].assetMeasureName    | "rightOuterTemp"    |
      | measures[3].values.temperature  | 40                  |
      | measures[4].assetMeasureName    | "rightInnerTemp"    |
      | measures[4].values.temperature  | -20                 |
    When I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI       | "attached_ayse_linked_1"   |
      | payloads[0].register1       | -11                        |
      | payloads[0].delayRegister1  | 999999                     |
      | payloads[0].register2       | 31                         |
      | payloads[1].deviceEUI       | "attached_ayse_linked_2"   |
      | payloads[1].register1       | -21                        |
      | payloads[1].register2       | 41                         |
      | payloads[1].delayRegister2  | 999999                     |
      | payloads[1].lvlBattery      | 0.91                       |
      | payloads[1].delayLvlBattery | 999999                     |
    Then I refresh the collection "engine-ayse":"assets"
    And The document "engine-ayse":"assets":"container-FRIDGE-linked" content match:
      | measures[0].assetMeasureName    | "coreBatteryLevel"  |
      | measures[0].values.battery      | 90                  |
      | measures[1].assetMeasureName    | "leftOuterTemp"     |
      | measures[1].values.temperature  | 31                  |
      | measures[2].assetMeasureName    | "leftInnerTemp"     | 
      | measures[2].values.temperature  | -10                 |
      | measures[3].assetMeasureName    | "rightOuterTemp"    |
      | measures[3].values.temperature  | 40                  |
      | measures[4].assetMeasureName    | "rightInnerTemp"    |
      | measures[4].values.temperature  | -21                 |

  Scenario: Get payloads from devices to multiple assetes
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id                                         | "DummyMultiTemp-attached_ayse_unlinked_1"  |
      | assetId                                     | "container-FRIDGE-unlinked_1"             |
      | body.metadata.index                         | "engine-ayse"         |
      | body.measureNamesLinks[0].assetMeasureName  | "coreBatteryLevel"   |
      | body.measureNamesLinks[0].deviceMeasureName | "lvlBattery"    |
    When I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI    | "attached_ayse_linked_1"   |
      | payloads[0].lvlBattery   | 0.12                       |
      | payloads[1].deviceEUI    | "attached_ayse_unlinked_1" |
      | payloads[1].lvlBattery   | 0.11                       |
    Then The document "engine-ayse":"assets":"container-FRIDGE-linked" content match:
      | measures[0].assetMeasureName    | "coreBatteryLevel"  |
      | measures[0].values.battery      | 12                  |
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | measures[0].assetMeasureName    | "coreBatteryLevel"  |
      | measures[0].values.battery      | 11                  |
