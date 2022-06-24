Feature: Device provisioning

  Scenario: Create a device in administration index
    When I successfully execute the action "device-manager/device":"create" with args:
      | engineId       | "device-manager" |
      | body.model     | "DummyTemp"      |
      | body.reference | "MATALE"         |
    Then The document "device-manager":"devices":"DummyTemp-MATALE" exists

  Scenario: Create a device in a device-manager engine and linked to an asset
    When I successfully execute the action "device-manager/device":"create" with args:
      | engineId               | "engine-ayse"               |
      | body.assetId           | "container-FRIDGE-unlinked_1" |
      | body.measureNamesLinks | [{"assetMeasureName":"coreTemp", "deviceMeasureName":"theTemperature"}] |
      | body.model                            | "DummyTemp"  |
      | body.reference                        | "MATALE"     |
    Then The document "device-manager":"devices":"DummyTemp-MATALE" content match:
      | assetId | "container-FRIDGE-unlinked_1" |
    And The document "engine-ayse":"devices":"DummyTemp-MATALE" content match:
      | assetId | "container-FRIDGE-unlinked_1" |
    And The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | deviceLinks[0].deviceId                               | "DummyTemp-MATALE"  |
      | deviceLinks[0].measureNamesLinks[0].assetMeasureName  | "coreTemp"          |
      | deviceLinks[0].measureNamesLinks[0].deviceMeasureName | "theTemperature"    |

      # TODO : Finish
  Scenario: Create by provisioning by a payload
    Given I successfully execute the action "document":"update" with args:
      | index                                    | "device-manager"         |
      | collection                               | "config"                 |
      | _id                                      | "plugin--device-manager" |
      | body.device-manager.provisioningStrategy | "auto"                   |
    When I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI   | "didNotExist" |
      | payloads[0].register1   | -10           |
      | payloads[0].register2   | 30            |
      | payloads[0].lvlBattery  | 0.9           |
    And I refresh the collection "device-manager":"devices"
    Then The document "device-manager":"devices":"DummyMultiTemp-didNotExist" exist
