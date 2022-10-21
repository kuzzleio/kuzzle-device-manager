Feature: Measure propagation in Digital Twins

  Scenario: Propagate measures into a linked asset
    When I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI     | "attached_ayse_linked_1" |
      | payloads[0].registerInner | -10                      |
      | payloads[0].registerOuter | 30                       |
      | payloads[0].lvlBattery    | 0.9                      |
      | payloads[1].deviceEUI     | "attached_ayse_linked_2" |
      | payloads[1].registerInner | -20                      |
      | payloads[1].registerOuter | 40                       |
    Then The document "engine-ayse":"assets":"container-FRIDGE-linked" content match:
      | measures[0].assetMeasureName   | "coreBatteryLevel" |
      | measures[0].values.battery     | 90                 |
      | measures[1].assetMeasureName   | "leftOuterTemp"    |
      | measures[1].values.temperature | 30                 |
      | measures[2].assetMeasureName   | "leftInnerTemp"    |
      | measures[2].values.temperature | -10                |
      | measures[3].assetMeasureName   | "rightOuterTemp"   |
      | measures[3].values.temperature | 40                 |
      | measures[4].assetMeasureName   | "rightInnerTemp"   |
      | measures[4].values.temperature | -20                |
    When I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI               | "attached_ayse_linked_1" |
      | payloads[0].registerInner           | -11                      |
      | payloads[0].measuredAtRegisterInner | 100000                   |
      | payloads[0].registerOuter           | 31                       |
      | payloads[1].deviceEUI               | "attached_ayse_linked_2" |
      | payloads[1].registerInner           | -21                      |
      | payloads[1].registerOuter           | 41                       |
      | payloads[1].measuredAtRegisterOuter | 100000                   |
      | payloads[1].lvlBattery              | 0.91                     |
      | payloads[1].measuredAtLvlBattery    | 100000                   |
    And I refresh the collection "engine-ayse":"assets"
    Then The document "engine-ayse":"assets":"container-FRIDGE-linked" content match:
      | measures[0].assetMeasureName   | "coreBatteryLevel" |
      | measures[0].values.battery     | 90                 |
      | measures[1].assetMeasureName   | "leftOuterTemp"    |
      | measures[1].values.temperature | 31                 |
      | measures[2].assetMeasureName   | "leftInnerTemp"    |
      | measures[2].values.temperature | -10                |
      | measures[3].assetMeasureName   | "rightOuterTemp"   |
      | measures[3].values.temperature | 40                 |
      | measures[4].assetMeasureName   | "rightInnerTemp"   |
      | measures[4].values.temperature | -21                |

  Scenario: Propagate measures into differents linked assets
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id                                         | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId                                     | "container-FRIDGE-unlinked_1"             |
      | body.metadata.index                         | "engine-ayse"                             |
      | body.measureNamesLinks[0].assetMeasureName  | "coreBatteryLevel"                        |
      | body.measureNamesLinks[0].deviceMeasureName | "lvlBattery"                              |
      | engineId                                    | "engine-ayse"                             |
    When I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI  | "attached_ayse_linked_1"   |
      | payloads[0].lvlBattery | 0.12                       |
      | payloads[1].deviceEUI  | "attached_ayse_unlinked_1" |
      | payloads[1].lvlBattery | 0.11                       |
    Then The document "engine-ayse":"assets":"container-FRIDGE-linked" content match:
      | measures[0].assetMeasureName | "coreBatteryLevel" |
      | measures[0].values.battery   | 12                 |
    And The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | measures[0].assetMeasureName | "coreBatteryLevel" |
