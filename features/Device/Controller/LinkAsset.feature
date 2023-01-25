Feature: LinkAsset

  Scenario: Link devices to an asset
    When I successfully execute the action "device-manager/devices":"linkAsset" with args:
      | _id                         | "DummyTemp-unlinked1" |
      | assetId                     | "Container-unlinked1" |
      | engineId                    | "engine-ayse"         |
      | body.measureNames[0].device | "temperature"         |
      | body.measureNames[0].asset  | "temperatureExt"      |
    Then The document "device-manager":"devices":"DummyTemp-unlinked1" content match:
      | assetId              | "Container-unlinked1" |
      | _kuzzle_info.updater | "-1"                  |
    And The document "engine-ayse":"devices":"DummyTemp-unlinked1" content match:
      | assetId              | "Container-unlinked1" |
      | _kuzzle_info.updater | "-1"                  |
    And The document "engine-ayse":"assets":"Container-unlinked1" content match:
      | linkedDevices[0]._id                    | "DummyTemp-unlinked1" |
      | linkedDevices[0].measureNames[0].asset  | "temperatureExt"      |
      | linkedDevices[0].measureNames[0].device | "temperature"         |
      | _kuzzle_info.updater                    | "-1"                  |
    # Link second device
    When I successfully execute the action "device-manager/devices":"linkAsset" with args:
      | _id                         | "DummyTemp-unlinked2" |
      | assetId                     | "Container-unlinked1" |
      | engineId                    | "engine-ayse"         |
      | body.measureNames[0].device | "temperature"         |
      | body.measureNames[0].asset  | "temperatureInt"      |
    And The document "engine-ayse":"assets":"Container-unlinked1" content match:
      | linkedDevices[0]._id                    | "DummyTemp-unlinked1" |
      | linkedDevices[0].measureNames[0].asset  | "temperatureExt"      |
      | linkedDevices[0].measureNames[0].device | "temperature"         |
      | linkedDevices[1]._id                    | "DummyTemp-unlinked2" |
      | linkedDevices[1].measureNames[0].asset  | "temperatureInt"      |

  Scenario: Link device with default measure names
    Given I successfully execute the action "device-manager/devices":"linkAsset" with args:
      | _id                         | "DummyTemp-unlinked1" |
      | assetId                     | "Container-unlinked1" |
      | engineId                    | "engine-ayse"         |
      | body.measureNames[0].device | "temperature"         |
      | body.measureNames[0].asset  | "temperatureExt"      |
    When I successfully execute the action "device-manager/devices":"linkAsset" with args:
      | _id                         | "DummyTempPosition-unlinked3" |
      | assetId                     | "Container-unlinked1"         |
      | engineId                    | "engine-ayse"                 |
      | implicitMeasuresLinking     | true                          |
      | body.measureNames[0].device | "temperature"                 |
      | body.measureNames[0].asset  | "temperatureInt"              |
    And The document "engine-ayse":"assets":"Container-unlinked1" content match:
      # Keep the previously linked measure
      | linkedDevices[0]._id                    | "DummyTemp-unlinked1"         |
      | linkedDevices[0].measureNames[0].asset  | "temperatureExt"              |
      | linkedDevices[0].measureNames[0].device | "temperature"                 |
      # Explicitly linked measure
      | linkedDevices[1]._id                    | "DummyTempPosition-unlinked3" |
      | linkedDevices[1].measureNames.length    | 2                             |
      | linkedDevices[1].measureNames[0].asset  | "temperatureInt"              |
      | linkedDevices[1].measureNames[0].device | "temperature"                 |
      # Implicitly linked measure
      | linkedDevices[1].measureNames[1].asset  | "position"                    |
      | linkedDevices[1].measureNames[1].device | "position"                    |

  Scenario: Error when device is already linked
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                         | "DummyTemp-linked1"   |
      | assetId                     | "Container-unlinked1" |
      | engineId                    | "engine-ayse"         |
      | body.measureNames[0].device | "temperature"         |
      | body.measureNames[0].asset  | "temperatureExt"      |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-linked1\" is already linked to an asset." |

  Scenario: Error when linking a device and using an already used measure name
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                         | "DummyTemp-unlinked1" |
      | assetId                     | "Container-linked1"   |
      | engineId                    | "engine-ayse"         |
      | body.measureNames[0].device | "temperature"         |
      | body.measureNames[0].asset  | "temperatureExt"      |
    Then I should receive an error matching:
      | message | "Measure name \"temperatureExt\" is already used by another device on this asset." |

  Scenario: Error when device is not attached to an engine
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                         | "DummyTemp-detached1" |
      | assetId                     | "Container-unlinked1" |
      | engineId                    | "engine-ayse"         |
      | body.measureNames[0].device | "temperature"         |
      | body.measureNames[0].asset  | "temperatureExt"      |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-detached1\" is not attached to an engine." |

  Scenario: Error when device is attached to wrong engine
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                         | "DummyTemp-unlinked1" |
      | assetId                     | "Container-unlinked1" |
      | engineId                    | "engine-kuzzle"       |
      | body.measureNames[0].device | "temperature"         |
      | body.measureNames[0].asset  | "temperatureExt"      |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-unlinked1\" is not attached to the specified engine." |

  Scenario: Error when device is linked to non-existing asset
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                         | "DummyTemp-unlinked1"   |
      | assetId                     | "Container-nonexisting" |
      | engineId                    | "engine-ayse"           |
      | body.measureNames[0].device | "temperature"           |
      | body.measureNames[0].asset  | "temperatureExt"        |
    Then I should receive an error matching:
      | message | "Document \"Container-nonexisting\" not found in \"engine-ayse\":\"assets\"." |
