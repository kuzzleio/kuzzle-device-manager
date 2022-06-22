Feature: multipleLink

    Scenario: Link two devices to an asset
      When I successfully execute the action "device-manager/device":"mLinkAssets" with args:
        | _id                                         | "DummyTemp-attached_ayse_unlinked"  |
        | assetId                                     | "tools-MART-linked"                 |
        | body.measureNamesLinks[0].assetMeasureName  | "shellTemp"                         |
        | body.measureNamesLinks[0].deviceMeasureName | "theTemperature"                    |
        | body.measureNamesLinks[1].assetMeasureName  | "coreBattery"                       |
        | body.measureNamesLinks[1].deviceMeasureName | "theBattery"                        |
      Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
        | assetId | "tools-MART-linked" |
      And The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
        | assetId | "tools-MART-linked" |
      And The document "engine-ayse":"assets":"tools-MART-linked" content match:
        # | deviceLink[0].
        | measures[0].type               | "temperature"                      |
        | measures[1].type               | "battery"                          |
        | measures[2].type               | "temperature"                      |
        | measures[3].type               | "battery"                          |
        | measures[0].name               | "External temperature"             |
        | measures[1].name               | "Battery2"                         |
        | measures[2].name               | "temperature"                      |
        | measures[3].name               | "battery"                          |

