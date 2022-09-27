Feature: LinkAsset

  Scenario: Create a device with an incorrect link request (wrong measureNamesLinks) throw an error:
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id                    | "DummyMultiTemp-attached_ayse_unlinked_1"                               |
      | body.measureNamesLinks | [{"assetMeasureName":"coreTemp", "deviceMeasureName":"theTemperature"}] |
      | engineId               | "engine-ayse"                                                           |
    Then I should receive an error matching:
      | message | "Missing argument \"assetId\"." |

  Scenario: Create a device with an incorrect link request (no assetId) throw an error:
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id                    | "DummyMultiTemp-attached_ayse_unlinked_1"                                 |
      | assetId                | "container-FRIDGE-unlinked_1"                                             |
      | body.measureNamesLinks | [{"invalidMeasureName":"coreTemp", "deviceMeasureName":"theTemperature"}] |
      | engineId               | "engine-ayse"                                                             |
    Then I should receive an error matching:
      | message | "The linkRequest provided is incorrectly formed\\nThis is probably not a Kuzzle error, but a problem with a plugin implementation." |

  Scenario: Link device to an asset without measureNamesLinks
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id      | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId  | "container-FRIDGE-unlinked_1"             |
      | engineId | "engine-ayse"                             |
    Then The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | "container-FRIDGE-unlinked_1" |
    And The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | "container-FRIDGE-unlinked_1" |
    And The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | deviceLinks[0].deviceId                               | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | deviceLinks[0].measureNamesLinks[0].assetMeasureName  | "innerTemp"                               |
      | deviceLinks[0].measureNamesLinks[0].deviceMeasureName | "innerTemp"                               |
      | deviceLinks[0].measureNamesLinks[1].assetMeasureName  | "outerTemp"                               |
      | deviceLinks[0].measureNamesLinks[1].deviceMeasureName | "outerTemp"                               |
      | deviceLinks[0].measureNamesLinks[2].assetMeasureName  | "lvlBattery"                              |
      | deviceLinks[0].measureNamesLinks[2].deviceMeasureName | "lvlBattery"                              |

  Scenario: Link device to an asset with partial measureNamesLinks and receive a payload
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id                                         | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId                                     | "container-FRIDGE-unlinked_1"             |
      | body.measureNamesLinks[0].assetMeasureName  | "coreInnerTemp"                           |
      | body.measureNamesLinks[0].deviceMeasureName | "innerTemp"                               |
      | engineId                                    | "engine-ayse"                             |
    Then The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | "container-FRIDGE-unlinked_1" |
    And The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | "container-FRIDGE-unlinked_1" |
    And The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | deviceLinks[0].deviceId                               | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | deviceLinks[0].measureNamesLinks[0].assetMeasureName  | "coreInnerTemp"                           |
      | deviceLinks[0].measureNamesLinks[0].deviceMeasureName | "innerTemp"                               |
    When I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI     | "attached_ayse_unlinked_1" |
      | payloads[0].registerInner | 1                          |
      | payloads[0].registerOuter | 2                          |
      | payloads[0].lvlBattery    | 1                          |
    And I refresh the collection "engine-ayse":"assets"
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | measures[0].type               | "temperature"                             |
      | measures[0].values.temperature | 1                                         |
      | measures[0].deviceMeasureName  | "innerTemp"                               |
      | measures[0].assetMeasureName   | "coreInnerTemp"                           |
      | measures[0].asset._id          | "container-FRIDGE-unlinked_1"             |
      | measures[0].origin.id          | "DummyMultiTemp-attached_ayse_unlinked_1" |

  Scenario: Link device to an asset and enriching the asset with before event
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id      | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId  | "container-FRIDGE-unlinked_1"             |
      | engineId | "engine-ayse"                             |
    Then The document "tests":"events":"device-manager:device:link-asset:before" content match:
      | device._id | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | asset._id  | "container-FRIDGE-unlinked_1"             |
    And The document "tests":"events":"device-manager:device:link-asset:after" content match:
      | device._id | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | asset._id  | "container-FRIDGE-unlinked_1"             |

  Scenario: Error when device is already linked
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id      | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId  | "container-FRIDGE-unlinked_1"             |
      | engineId | "engine-ayse"                             |
    And I execute the action "device-manager/device":"linkAsset" with args:
      | _id      | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId  | "tools-SCREW-unlinked_1"                  |
      | engineId | "engine-ayse"                             |
    Then I should receive an error matching:
      | message | "Device \"DummyMultiTemp-attached_ayse_unlinked_1\" is already linked to an asset." |

  Scenario: Link multiple device to multiple assets using JSON
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.linkRequests[0].assetId             | "container-FRIDGE-unlinked_1"             |
      | body.linkRequests[0].deviceLink.deviceId | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | engineId                                 | "engine-ayse"                             |
    Then The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | "container-FRIDGE-unlinked_1" |
    And The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | "container-FRIDGE-unlinked_1" |

  Scenario: Error when device is not attached to an engine
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id                                         | "DummyMultiTemp-detached"     |
      | assetId                                     | "container-FRIDGE-unlinked_1" |
      | body.measureNamesLinks[0].assetMeasureName  | "outerTemp"                   |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"              |
      | engineId                                    | "engine-ayse"                 |
    Then I should receive an error matching:
      | message | "Device \"DummyMultiTemp-detached\" is not attached to an engine." |

  Scenario: Error when device is not attached to an engine
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id      | "DummyMultiTemp-detached"     |
      | assetId  | "container-FRIDGE-unlinked_1" |
      | engineId | "engine-ayse"                 |
    Then I should receive an error matching:
      | message | "Device \"DummyMultiTemp-detached\" is not attached to an engine." |

  Scenario: Error when device is attached to wrong engine
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id      | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId  | "container-FRIDGE-unlinked_1"             |
      | engineId | "engine-kuzzle"                           |
    Then I should receive an error matching:
      | message | "Device \"DummyMultiTemp-attached_ayse_unlinked_1\" is not attached to given engine." |

  Scenario: Error when device is linked to non-existing asset
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id                                         | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId                                     | "PERFO-non-existing"                      |
      | engineId                                    | "engine-ayse"                             |
      | body.measureNamesLinks[0].assetMeasureName  | "outerTemp"                               |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"                          |
    Then I should receive an error matching:
      | message | "Document \"PERFO-non-existing\" not found in \"engine-ayse\":\"assets\"." |
