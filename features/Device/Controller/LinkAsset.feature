Feature: LinkAsset

  Scenario: Create a device with an incorrect link request (wrong measureNamesLinks) throw an error:
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                                         | "DummyTemp-unlinked1" |
      | engineId                                    | "engine-ayse"         |
      | body.measureNamesLinks[0].assetMeasureName  | "coreTemp"            |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"      |
    Then I should receive an error matching:
      | message | "Missing argument \"assetId\"." |

  Scenario: Create a device with an incorrect link request (no assetId) throw an error:
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                                          | "DummyTemp-unlinked1" |
      | assetId                                      | "container-unlinked1" |
      | engineId                                     | "engine-ayse"         |
      | body.measureNamesLinks[0].invalidMeasureName | "coreTemp"            |
      | body.measureNamesLinks[0].deviceMeasureName  | "theTemperature"      |
    Then I should receive an error matching:
      | message | "Missing \"measureNamesLinks[0].assetMeasureName\"" |

  Scenario: Link device to an asset
    When I successfully execute the action "device-manager/devices":"linkAsset" with args:
      | _id                                         | "DummyTemp-unlinked1" |
      | assetId                                     | "container-unlinked1" |
      | engineId                                    | "engine-ayse"         |
      | body.measureNamesLinks[0].assetMeasureName  | "temperature"         |
      | body.measureNamesLinks[0].deviceMeasureName | "temperature"         |
    Then The document "device-manager":"devices":"DummyTemp-unlinked1" content match:
      | assetId | "container-unlinked1" |
    And The document "engine-ayse":"devices":"DummyTemp-unlinked1" content match:
      | assetId | "container-unlinked1" |
    And The document "engine-ayse":"assets":"container-unlinked1" content match:
      | deviceLinks[0].deviceId                               | "DummyTemp-unlinked1" |
      | deviceLinks[0].measureNamesLinks[0].assetMeasureName  | "temperature"         |
      | deviceLinks[0].measureNamesLinks[0].deviceMeasureName | "temperature"         |

  Scenario: Error when device is already linked
    When I successfully execute the action "device-manager/devices":"linkAsset" with args:
      | _id                                         | "DummyTemp-unlinked1" |
      | assetId                                     | "container-unlinked1" |
      | engineId                                    | "engine-ayse"         |
      | body.measureNamesLinks[0].assetMeasureName  | "temperature"         |
      | body.measureNamesLinks[0].deviceMeasureName | "temperature"         |
    And I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                                         | "DummyTemp-unlinked1"    |
      | assetId                                     | "tools-SCREW-unlinked_1" |
      | engineId                                    | "engine-ayse"            |
      | body.measureNamesLinks[0].assetMeasureName  | "temperature"            |
      | body.measureNamesLinks[0].deviceMeasureName | "temperature"            |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-unlinked1\" is already linked to an asset." |

  Scenario: Error when device is not attached to an engine
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                                         | "DummyTemp-detached1" |
      | assetId                                     | "container-unlinked1" |
      | body.measureNamesLinks[0].assetMeasureName  | "outerTemp"           |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"      |
      | engineId                                    | "engine-ayse"         |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-detached1\" is not attached to an engine." |

  Scenario: Error when device is attached to wrong engine
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                                         | "DummyTemp-unlinked1" |
      | assetId                                     | "container-unlinked1" |
      | engineId                                    | "engine-kuzzle"       |
      | body.measureNamesLinks[0].assetMeasureName  | "temperature"         |
      | body.measureNamesLinks[0].deviceMeasureName | "temperature"         |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-unlinked1\" is not attached to the specified engine." |

  Scenario: Error when device is linked to non-existing asset
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                                         | "DummyTemp-unlinked1"   |
      | assetId                                     | "container-nonexisting" |
      | engineId                                    | "engine-ayse"           |
      | body.measureNamesLinks[0].assetMeasureName  | "outerTemp"             |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"        |
    Then I should receive an error matching:
      | message | "Document \"container-nonexisting\" not found in \"engine-ayse\":\"assets\"." |
