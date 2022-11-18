Feature: LinkAsset

  Scenario: Link devices to an asset
    When I successfully execute the action "device-manager/devices":"linkAsset" with args:
      | _id                           | "DummyTemp-unlinked1" |
      | assetId                       | "container-unlinked1" |
      | engineId                      | "engine-ayse"         |
      | body.measureNames.temperature | "temperatureExt"      |
    Then The document "device-manager":"devices":"DummyTemp-unlinked1" content match:
      | assetId | "container-unlinked1" |
    And The document "engine-ayse":"devices":"DummyTemp-unlinked1" content match:
      | assetId | "container-unlinked1" |
    And The document "engine-ayse":"assets":"container-unlinked1" content match:
      | linkedDevices[0]._id                   | "DummyTemp-unlinked1" |
      | linkedDevices[0].measures.temperature | "temperatureExt"      |
    When I successfully execute the action "device-manager/devices":"linkAsset" with args:
      | _id                           | "DummyTemp-unlinked2" |
      | assetId                       | "container-unlinked1" |
      | engineId                      | "engine-ayse"         |
      | body.measureNames.temperature | "temperatureInt"      |
    And The document "engine-ayse":"assets":"container-unlinked1" content match:
      | linkedDevices[0]._id                   | "DummyTemp-unlinked1" |
      | linkedDevices[0].measures.temperature | "temperatureExt"      |
      | linkedDevices[1]._id                   | "DummyTemp-unlinked2" |
      | linkedDevices[1].measures.temperature | "temperatureInt"      |

  Scenario: Error when device is already linked
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                           | "DummyTemp-linked1"   |
      | assetId                       | "container-unlinked1" |
      | engineId                      | "engine-ayse"         |
      | body.measureNames.temperature | "temperatureExt"      |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-linked1\" is already linked to an asset." |

  Scenario: Error when linking a device and using an already used measure name
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                           | "DummyTemp-unlinked1" |
      | assetId                       | "container-linked1"   |
      | engineId                      | "engine-ayse"         |
      | body.measureNames.temperature | "temperatureExt"      |
    Then I should receive an error matching:
      | message | "Measure name \"temperatureExt\" is already used by another device." |

  Scenario: Error when device is not attached to an engine
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                           | "DummyTemp-detached1" |
      | assetId                       | "container-unlinked1" |
      | engineId                      | "engine-ayse"         |
      | body.measureNames.temperature | "temperatureExt"      |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-detached1\" is not attached to an engine." |

  Scenario: Error when device is attached to wrong engine
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                           | "DummyTemp-unlinked1" |
      | assetId                       | "container-unlinked1" |
      | engineId                      | "engine-kuzzle"       |
      | body.measureNames.temperature | "temperatureExt"      |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-unlinked1\" is not attached to the specified engine." |

  Scenario: Error when device is linked to non-existing asset
    When I execute the action "device-manager/devices":"linkAsset" with args:
      | _id                           | "DummyTemp-unlinked1"   |
      | assetId                       | "container-nonexisting" |
      | engineId                      | "engine-ayse"           |
      | body.measureNames.temperature | "temperatureExt"        |
    Then I should receive an error matching:
      | message | "Document \"container-nonexisting\" not found in \"engine-ayse\":\"assets\"." |
