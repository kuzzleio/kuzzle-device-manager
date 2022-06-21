Feature: LinkAsset

  Scenario: Link device to an asset
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id                                     | "DummyTemp-attached_ayse_unlinked" |
      | assetId                                 | "tools-PERFO-unlinked"             |
      | body.measureNamesLinks[0].assetMeasureName  | "extTemp"                          |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"                   |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |

  Scenario: Link device to an asset and enriching the asset with before event
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-PERFO-unlinked"             |
      | body.measureNamesLinks[0].assetMeasureName  | "extTemp"                          |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"                   |
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
      | body.measureNamesLinks[0].assetMeasureName  | "extTemp"                          |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"                   |
    And I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-SCREW-unlinked"             |
      | body.measureNamesLinks[0].assetMeasureName  | "extTemp"                          |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"                   |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-attached_ayse_unlinked\" is already linked to an asset." |

  Scenario: Link multiple device to multiple assets using JSON
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.linkRequests[0].assetId  | "tools-PERFO-unlinked"             |
      | body.linkRequests[0].deviceLink.deviceId | "DummyTemp-attached_ayse_unlinked" |
      | body.linkRequests[0].deviceLink.measureNamesLinks[0].assetMeasureName  | "extTemp"        |
      | body.linkRequests[0].deviceLink.measureNamesLinks[0].deviceMeasureName | "theTemperature" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | "tools-PERFO-unlinked" |

  Scenario: Error when device is not attached to an engine
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-detached"   |
      | assetId | "tools-PERFO-unlinked" |
      | body.measureNamesLinks[0].assetMeasureName  | "extTemp"                          |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"                   |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-detached\" is not attached to an engine." |

  Scenario: Error when device is linked to non-existing asset
    When I execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "PERFO-non-existing"               |
      | body.measureNamesLinks[0].assetMeasureName  | "extTemp"                          |
      | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"                   |
    Then I should receive an error matching:
      | message | "Document \"PERFO-non-existing\" not found in \"engine-ayse\":\"assets\"." |
