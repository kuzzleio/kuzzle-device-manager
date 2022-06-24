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
      | body.measureNamesLinks[0].deviceMeasureName | "extTemp"                                 |
    And I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id                                         | "DummyMultiTemp-attached_ayse_unlinked_2" |
      | assetId                                     | "container-FRIDGE-unlinked_1"             |
      | body.measureNamesLinks[0].assetMeasureName  | "coreTemp"                                |
      | body.measureNamesLinks[0].deviceMeasureName | "extTemp"                                 |
    When I successfully execute the action "device-manager/device":"mUnlinkAssets" with args:
      | body.deviceIds[0] | "DummyMultiTemp-attached_ayse_unlinked_1" |  
      | body.deviceIds[1] | "DummyMultiTemp-attached_ayse_unlinked_2" |  
    Then The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | null |
    Then The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | null |
    And The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | deviceLinks  | [] |

#   Scenario: Unlink multiple device from multiple assets using CSV
#     Given I successfully execute the action "device-manager/device":"linkAsset" with args:
#       | _id     | "DummyMultiTemp-attached_ayse_unlinked_1" |
#       | assetId | "tools-PERFO-unlinked"             |
#     When I successfully execute the action "device-manager/device":"mUnlinkAssets" with args:
#       | body.csv | "deviceId\\nDummyMultiTemp-attached_ayse_unlinked_1" |
#     Then The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
#       | assetId | null |
#     Then The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
#       | assetId | null |
#     And The document "engine-ayse":"assets":"tools-PERFO-unlinked" content match:
#       | measures | {} |

#   Scenario: Keep measures of first device when the second one is unlinked
#     Given I successfully execute the action "device-manager/device":"attachEngine" with args:
#       | _id      | "DummyMultiTemp-detached"  |
#       | engineId | "engine-ayse"              |
#     When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
#       | body.records.0.deviceId | "DummyMultiTemp-detached"               |
#       | body.records.0.assetId  | "tools-PERFO-unlinked"             |
#       | body.records.1.deviceId | "DummyMultiTemp-attached_ayse_unlinked_1" |
#       | body.records.1.assetId  | "tools-PERFO-unlinked"             |
#     And The document "engine-ayse":"assets":"tools-PERFO-unlinked" content match:
#       | measures[0].type                | "temperature"                      |
#       | measures[0].measuredAt          | 1610793427950                      |
#       | measures[0].values.temperature  | 23.3                               |
#       | measures[0].origin.id           | "DummyMultiTemp-attached_ayse_unlinked_1" |
#       | measures[0].origin.model        | "DummyMultiTemp"                        |
#       | measures[0].origin.type         | "device"                           |
#       | measures[0].unit.name           | "Degree"                           |
#       | measures[0].unit.sign           | "°"                                |
#       | measures[0].unit.type           | "number"                           |
#       | measures[1].type                | "battery"                          |
#       | measures[1].measuredAt          | 1610793427950                      |
#       | measures[1].values.battery      | 80                                 |
#       | measures[1].origin.id           | "DummyMultiTemp-attached_ayse_unlinked_1" |
#       | measures[1].origin.model        | "DummyMultiTemp"                        |
#       | measures[1].origin.type         | "device"                           |
#       | measures[1].unit.name           | "Volt"                             |
#       | measures[1].unit.sign           | "v"                                |
#       | measures[1].unit.type           | "number"                           |
#       | measures[2].type                | "position"                         |
#       | measures[2].measuredAt          | 1610793427950                      |
#       | measures[2].values.position.lat | 43.610767                          |
#       | measures[2].values.position.lon | 3.876716                           |
#       | measures[2].values.accuracy     | 42                                 |
#       | measures[2].origin.id           | "DummyMultiTemp-detached"               |
#       | measures[2].origin.model        | "DummyMultiTemp"                        |
#       | measures[2].origin.type         | "device"                           |
#       | measures[2].unit.name           | "GPS"                              |
#       | measures[2].unit.type           | "geo_point"                        |
#     When I successfully execute the action "device-manager/device":"unlinkAsset" with args:
#       | _id | "DummyMultiTemp-attached_ayse_unlinked_1" |
#     Then The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
#       | assetId | null |
#     Then The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
#       | assetId | null |
#     And The document "engine-ayse":"assets":"tools-PERFO-unlinked" content match:
#       | measures[0].type                | "position"           |
#       | measures[0].measuredAt          | 1610793427950        |
#       | measures[0].values.position.lat | 43.610767            |
#       | measures[0].values.position.lon | 3.876716             |
#       | measures[0].values.accuracy     | 42                   |
#       | measures[0].origin.id           | "DummyMultiTemp-detached" |
#       | measures[0].origin.model        | "DummyMultiTemp"          |
#       | measures[0].origin.type         | "device"             |
#       | measures[0].unit.name           | "GPS"                |
#       | measures[0].unit.type           | "geo_point"          |
