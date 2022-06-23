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
      | body.assetId           | "container-FRIDGE-unlinked" |
      | body.measureNamesLinks | [{"assetMeasureName":"coreTemp", "deviceMeasureName":"theTemperature"}] |
      | body.model                            | "DummyTemp"  |
      | body.reference                        | "MATALE"     |
    Then The document "device-manager":"devices":"DummyTemp-MATALE" content match:
      | assetId | "container-FRIDGE-unlinked" |
    And The document "engine-ayse":"devices":"DummyTemp-MATALE" content match:
      | assetId | "container-FRIDGE-unlinked" |
    And The document "engine-ayse":"assets":"container-FRIDGE-unlinked" content match:
      | deviceLinks[0].deviceId                               | "DummyTemp-MATALE"  |
      | deviceLinks[0].measureNamesLinks[0].assetMeasureName  | "coreTemp"          |
      | deviceLinks[0].measureNamesLinks[0].deviceMeasureName | "theTemperature"    |
