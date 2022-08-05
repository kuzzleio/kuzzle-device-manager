Feature: UnlinkAsset

  Scenario: Error when the device was not linked
    When I execute the action "device-manager/device":"unlinkAsset" with args:
      | _id | "DummyMultiTemp-attached_ayse_unlinked_1" |
    Then I should receive an error matching:
      | message | "Device \"DummyMultiTemp-attached_ayse_unlinked_1\" is not linked to an asset." |

  Scenario: Unlink multiple device from multiple assets using JSON
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:

      | _id                                         | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId                                     | "container-FRIDGE-unlinked_1"             |
      | body.measureNamesLinks[0].assetMeasureName  | "coreTemp"                                |
      | body.measureNamesLinks[0].deviceMeasureName | "outerTemp"                                 |
            | engineId | "engine-ayse"                      |

    And I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id                                         | "DummyMultiTemp-attached_ayse_unlinked_2" |
      | assetId                                     | "container-FRIDGE-unlinked_1"             |
      | body.measureNamesLinks[0].assetMeasureName  | "coreTemp"                                |
      | body.measureNamesLinks[0].deviceMeasureName | "outerTemp"                                 |
            | engineId | "engine-ayse"                      |

    When I successfully execute the action "device-manager/device":"mUnlinkAssets" with args:
      | body.deviceIds[0] | "DummyMultiTemp-attached_ayse_unlinked_1" |  
      | body.deviceIds[1] | "DummyMultiTemp-attached_ayse_unlinked_2" |  
            | engineId | "engine-ayse"                      |

    Then The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | null |
    Then The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | null |
    And The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | deviceLinks  | [] |
