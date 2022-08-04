Feature: LinkAsset

  Scenario: Link device to an asset
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id                            | "DummyTemp-attached_ayse_unlinked" |
      | assetId                        | "tools-PERFO-unlinked"             |
      | body.measuresNames.temperature | "External temperature"             |
      | engineId                       | "engine-ayse"                      |
   Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"assets":"tools-PERFO-unlinked" content match:
      | measures[0].type               | "temperature"                      |
      | measures[0].name               | "External temperature"             |
      | measures[0].measuredAt         | 1610793427950                      |
      | measures[0].values.temperature | 23.3                               |
      | measures[0].origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures[0].origin.model       | "DummyTemp"                        |
      | measures[0].origin.type        | "device"                           |
      | measures[0].unit.name          | "Degree"                           |
      | measures[0].unit.sign          | "°"                                |
      | measures[0].unit.type          | "number"                           |
      | measures[1].type               | "battery"                          |
      | measures[1].name               | "battery"                          |
      | measures[1].measuredAt         | 1610793427950                      |
      | measures[1].values.battery     | 80                                 |
      | measures[1].origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures[1].origin.model       | "DummyTemp"                        |
      | measures[1].origin.type        | "device"                           |
      | measures[1].unit.name          | "Volt"                             |
      | measures[1].unit.sign          | "v"                                |
      | measures[1].unit.type          | "number"                           |
      | deviceLinks[0].deviceId        | "DummyTemp-attached_ayse_unlinked" |

  Scenario: Link device to an asset and enriching the asset with before event
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-PERFO-unlinked"             |
      | engineId                       | "engine-ayse"                      |
    And The document "tests":"events":"device-manager:device:link-asset:before" content match:
      | device._id | "DummyTemp-attached_ayse_unlinked" |
      | asset._id  | "tools-PERFO-unlinked"             |
    And The document "tests":"events":"device-manager:device:link-asset:after" content match:
      | device._id | "DummyTemp-attached_ayse_unlinked" |
      | asset._id  | "tools-PERFO-unlinked"             |

  Scenario: Error when device is already linked
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-PERFO-unlinked"             |
      | engineId                       | "engine-ayse"                      |
    And I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-SCREW-unlinked"             |
      | engineId                       | "engine-ayse"                      |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-attached_ayse_unlinked\" is already linked to an asset." |

  Scenario: Link multiple device to multiple assets using JSON
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.records.0.deviceId | "DummyTemp-attached_ayse_unlinked" |
      | body.records.0.assetId  | "tools-PERFO-unlinked"             |
      | engineId                       | "engine-ayse"                      |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"assets":"tools-PERFO-unlinked" content match:
      | measures[0].type               | "temperature"                      |
      | measures[0].measuredAt         | 1610793427950                      |
      | measures[0].values.temperature | 23.3                               |
      | measures[0].origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures[0].origin.model       | "DummyTemp"                        |
      | measures[0].origin.type        | "device"                           |
      | measures[0].unit.name          | "Degree"                           |
      | measures[0].unit.sign          | "°"                                |
      | measures[0].unit.type          | "number"                           |
      | measures[1].type               | "battery"                          |
      | measures[1].measuredAt         | 1610793427950                      |
      | measures[1].values.battery     | 80                                 |
      | measures[1].origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures[1].origin.model       | "DummyTemp"                        |
      | measures[1].origin.type        | "device"                           |
      | measures[1].unit.name          | "Volt"                             |
      | measures[1].unit.sign          | "v"                                |
      | measures[1].unit.type          | "number"                           |

  Scenario: Link multiple device to multiple assets using CSV
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.csv | "deviceId,assetId\\nDummyTemp-attached_ayse_unlinked,tools-PERFO-unlinked" |
      | engineId                | "engine-ayse"                      |

    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"assets":"tools-PERFO-unlinked" content match:
      | measures[0].type               | "temperature"                      |
      | measures[0].measuredAt         | 1610793427950                      |
      | measures[0].values.temperature | 23.3                               |
      | measures[0].origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures[0].origin.model       | "DummyTemp"                        |
      | measures[0].origin.type        | "device"                           |
      | measures[0].unit.name          | "Degree"                           |
      | measures[0].unit.sign          | "°"                                |
      | measures[0].unit.type          | "number"                           |
      | measures[1].type               | "battery"                          |
      | measures[1].measuredAt         | 1610793427950                      |
      | measures[1].values.battery     | 80                                 |
      | measures[1].origin.id          | "DummyTemp-attached_ayse_unlinked" |
      | measures[1].origin.model       | "DummyTemp"                        |
      | measures[1].origin.type        | "device"                           |
      | measures[1].unit.name          | "Volt"                             |
      | measures[1].unit.sign          | "v"                                |
      | measures[1].unit.type          | "number"                           |

  Scenario: Error when device is not attached to an engine
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id      | "DummyTemp-detached"   |
      | assetId  | "tools-PERFO-unlinked" |
      | engineId | "engine-ayse"          |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-detached\" is not attached to an engine." |

  Scenario: Error when device is not attached to an engine
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id      | "DummyTemp-detached"   |
      | assetId  | "tools-PERFO-unlinked" |
      | engineId | "engine-ayse"          |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-detached\" is not attached to an engine." |

  Scenario: Error when device is attached to wrong engine
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id      | "DummyTemp-attached_ayse_unlinked"   |
      | assetId  | "tools-MART-linked" |
      | engineId | "engine-kuzzle"          |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-attached_ayse_unlinked\" is not attached to given engine." |

  Scenario: Error when device is linked to non-existing asset
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "PERFO-non-existing"               |
      | engineId                | "engine-ayse"      |
    Then I should receive an error matching:
      | message | "Document \"PERFO-non-existing\" not found in \"engine-ayse\":\"assets\"." |
