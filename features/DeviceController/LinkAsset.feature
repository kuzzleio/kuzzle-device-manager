Feature: LinkAsset

  Scenario: Link device to an asset without measureNamesLinks
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id                                     | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId                                 | "container-FRIDGE-unlinked_1"             |
    Then The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | "container-FRIDGE-unlinked_1" |
    And The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | "container-FRIDGE-unlinked_1" |
    And The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | deviceLinks[0].deviceId                               | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | deviceLinks[0].measureNamesLinks[0].assetMeasureName  | "innerTemp"                               |
      | deviceLinks[0].measureNamesLinks[0].deviceMeasureName | "innerTemp"                               |
      | deviceLinks[0].measureNamesLinks[1].assetMeasureName  | "extTemp"                                 |
      | deviceLinks[0].measureNamesLinks[1].deviceMeasureName | "extTemp"                                 |
      | deviceLinks[0].measureNamesLinks[2].assetMeasureName  | "lvlBattery"                              |
      | deviceLinks[0].measureNamesLinks[2].deviceMeasureName | "lvlBattery"                              |

  Scenario: Link device to an asset with measureNamesLinks
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id                                     | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId                                 | "container-FRIDGE-unlinked_1"             |
      | body.measureNamesLinks[0].assetMeasureName  | "coreInnerTemp"                     |
      | body.measureNamesLinks[0].deviceMeasureName | "innerTemp"                         |
    Then The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | "container-FRIDGE-unlinked_1" |
    And The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | "container-FRIDGE-unlinked_1" |
    And The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | deviceLinks[0].deviceId                               | "DummyMultiTemp-attached_ayse_unlinked_1"  |
      | deviceLinks[0].measureNamesLinks[0].assetMeasureName  | "coreInnerTemp"                     |
      | deviceLinks[0].measureNamesLinks[0].deviceMeasureName | "innerTemp"                         |

  Scenario: Link device to an asset and enriching the asset with before event
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId | "container-FRIDGE-unlinked_1"        |
      | body.measureNamesLinks[0].assetMeasureName  | "extTemp"                          |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"                   |
    And The document "tests":"events":"device-manager:device:link-asset:before" content match:
      | device._id | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | asset._id  | "container-FRIDGE-unlinked_1"        |
    And The document "tests":"events":"device-manager:device:link-asset:after" content match:
      | device._id | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | asset._id  | "container-FRIDGE-unlinked_1"        |

  Scenario: Error when device is already linked
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId | "container-FRIDGE-unlinked_1"             |
      | body.measureNamesLinks[0].assetMeasureName  | "extTemp"                          |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"                   |
    And I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId | "tools-SCREW-unlinked_1"             |
      | body.measureNamesLinks[0].assetMeasureName  | "extTemp"                          |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"                   |
    Then I should receive an error matching:
      | message | "Device \"DummyMultiTemp-attached_ayse_unlinked_1\" is already linked to an asset." |

  Scenario: Link multiple device to multiple assets using JSON
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.linkRequests[0].assetId  | "container-FRIDGE-unlinked_1"             |
      | body.linkRequests[0].deviceLink.deviceId | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | body.linkRequests[0].deviceLink.measureNamesLinks[0].assetMeasureName  | "extTemp"        |
      | body.linkRequests[0].deviceLink.measureNamesLinks[0].deviceMeasureName | "theTemperature" |
    Then The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | "container-FRIDGE-unlinked_1" |
    And The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | "container-FRIDGE-unlinked_1" |

  Scenario: Error when device is not attached to an engine
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyMultiTemp-detached"   |
      | assetId | "container-FRIDGE-unlinked_1" |
      | body.measureNamesLinks[0].assetMeasureName  | "extTemp"                          |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"                   |
    Then I should receive an error matching:
      | message | "Device \"DummyMultiTemp-detached\" is not attached to an engine." |

  Scenario: Error when device is linked to non-existing asset
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId | "PERFO-non-existing"               |
      | body.measureNamesLinks[0].assetMeasureName  | "extTemp"                          |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"                   |
    Then I should receive an error matching:
      | message | "Document \"PERFO-non-existing\" not found in \"engine-ayse\":\"assets\"." |
