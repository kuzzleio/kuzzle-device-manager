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
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id                     | "DummyMultiTemp-attached_ayse_unlinked"  |
      | assetId                 | "outils-PERFO-asset_02"             |
      | body.metadata.index     | "engine-ayse"         |
      | body.measureNamesLinks  | [ { assetMeasureName: "coreBattery", deviceMeasureName: "theBattery" }, { assetMeasureName: "motorTemp", deviceMeasureName: "theTemperature" } ] |
    When I successfully execute the action "device-manager/asset":"delete" with args:
      | engineId | "engine-ayse"         |
      | _id      | "outils-PERFO-asset_02" |
    Then The document "engine-ayse":"assets":"outils-PERFO-asset_02" does not exist:
    And The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked" content match:
      | assetId | null |
    And The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked" content match:
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
    Given I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI    | "attached_ayse_linked_1" |
      | payloads[0].register1    | 42.1                     |
    Given I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI    | "attached_ayse_linked_1" |
      | payloads[0].register1    | 42.0                     |
    Given I refresh the collection "engine-ayse":"measures"
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
      | _id       | "container-FRIDGE-unlinked" |
      | body      | { "measures": [ { "values": { "temperature": 70 }, "type": "temperature", "assetMeasureName": "leftOuterTemp" }, { "values": { "nothing": null }, "type": "nonValidType" } ] } |
    Then I should receive a result matching:
      | engineId  | "engine-ayse"                                                 |
      | invalids  | [ { "values": { "nothing": null }, "type": "nonValidType" } ] |
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked" content match:
      | measures | [ { "type": "temperature", "deviceMeasureName": null, "assetMeasureName": "leftOuterTemp", "values": { "temperature": 70 }, "origin": { "type": "asset" } } ] |
    When I successfully execute the action "device-manager/asset":"pushMeasures" with args:
      | engineId  | "engine-ayse"             |
      | _id       | "container-FRIDGE-unlinked" |
      | body      | { "measures": [ { "values": { "temperature": -3 }, "type": "temperature", "assetMeasureName": "leftInnerTemp" }, { "values": { "nothing": null }, "type": "nonValidType" } ] } |
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked" content match:
      | measures | [ { "assetMeasureName": "leftOuterTemp", "values": { "temperature": 70 } }, { "assetMeasureName": "leftInnerTemp", "values": { "temperature": -3 } } ] |
    When I successfully execute the action "device-manager/asset":"pushMeasures" with args:
      | engineId  | "engine-ayse"             |
      | _id       | "container-FRIDGE-unlinked" |
      | body      | { "measures": [ { "measuredAt": 1, "values": { "temperature": 98 }, "type": "temperature", "assetMeasureName": "leftOuterTemp" } ] } |
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked" content match:
      | measures | [ { "assetMeasureName": "leftOuterTemp", "values": { "temperature": 70 } }, { "assetMeasureName": "leftInnerTemp", "values": { "temperature": -3 } } ] |
    And I refresh the collection "engine-ayse":"measures"
    # 9 Existing measures from fixtures
    And I count 12 documents in "engine-ayse":"measures"
    When I successfully execute the action "device-manager/asset":"removeMeasure" with args:
      | engineId                    | "engine-ayse"               |
      | _id                         | "container-FRIDGE-unlinked" |
      | assetMeasureName            | "leftOuterTemp"             |
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked" content match:
      | measures | [ { "assetMeasureName": "leftInnerTemp", "values": { "temperature": -3 } } ] |
      

    # TODO: Get measures with delay from device then push on asset
  # Scenario: Get payloads from devices and register by 

