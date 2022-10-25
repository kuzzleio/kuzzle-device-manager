Feature: Device provisioning

  Scenario: Create a device in administration index
    When I successfully execute the action "device-manager/devices":"create" with args:
      | engineId       | "device-manager" |
      | body.model     | "DummyTemp"      |
      | body.reference | "MATALE"         |
    Then The document "device-manager":"devices":"DummyTemp-MATALE" exists

  Scenario: Create a device in an engine and linked to an asset
    When I successfully execute the action "device-manager/devices":"create" with args:
      | engineId                                    | "engine-ayse"         |
      | body.model                                  | "DummyTemp"           |
      | body.reference                              | "MATALE"              |
      | body.assetId                                | "container-unlinked1" |
      | body.measureNamesLinks[0].assetMeasureName  | "temperature"         |
      | body.measureNamesLinks[0].deviceMeasureName | "temperature"         |
    Then The document "device-manager":"devices":"DummyTemp-MATALE" content match:
      | assetId | "container-unlinked1" |
    And The document "engine-ayse":"devices":"DummyTemp-MATALE" content match:
      | assetId | "container-unlinked1" |
    And The document "engine-ayse":"assets":"container-unlinked1" content match:
      | deviceLinks[0].deviceId                               | "DummyTemp-MATALE" |
      | deviceLinks[0].measureNamesLinks[0].assetMeasureName  | "temperature"      |
      | deviceLinks[0].measureNamesLinks[0].deviceMeasureName | "temperature"      |
