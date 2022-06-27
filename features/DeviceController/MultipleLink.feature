Feature: multipleLink

  Scenario: Link two devices to an asset
    When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
      | body.linkRequests[0].assetId                | "container-FRIDGE-unlinked_1"           |
      | body.linkRequests[0].deviceLink.deviceId    | "DummyMultiTemp-attached_ayse_unlinked_1"    |
      | body.linkRequests[0].deviceLink.measureNamesLinks[0].assetMeasureName  | "shellTemp"  |
      | body.linkRequests[0].deviceLink.measureNamesLinks[0].deviceMeasureName | "extTemp"    |
      | body.linkRequests[1].assetId                | "container-FRIDGE-unlinked_2"           |
      | body.linkRequests[1].deviceLink.deviceId    | "DummyMultiTemp-attached_ayse_unlinked_2"    |
      | body.linkRequests[1].deviceLink.measureNamesLinks[0].assetMeasureName  | "shellTemp"  |
      | body.linkRequests[1].deviceLink.measureNamesLinks[0].deviceMeasureName | "extTemp"    |
    Then The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | "container-FRIDGE-unlinked_1" |
    And The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | "container-FRIDGE-unlinked_1" |
    And The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_2" content match:
      | assetId | "container-FRIDGE-unlinked_2" |
    And The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked_2" content match:
      | assetId | "container-FRIDGE-unlinked_2" |
