Feature: multipleLink

    Scenario: Link two devices to an asset
      When I successfully execute the action "device-manager/device":"linkAsset" with args:
        | _id                            | "DummyTemp-attached_ayse_unlinked" |
        | assetId                        | "tools-MART-linked"                |
        | body.measuresNames.temperature | "External temperature"             |
        | body.measuresNames.battery     | "Battery2"                         |
        | engineId                       | "engine-ayse"                      |
      Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
        | assetId | "tools-MART-linked" |
      And The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
        | assetId | "tools-MART-linked" |
      And The document "engine-ayse":"assets":"tools-MART-linked" content match:
        | measures[0].type               | "temperature"                      |
        | measures[1].type               | "battery"                          |
        | measures[2].type               | "temperature"                      |
        | measures[3].type               | "battery"                          |
        | measures[0].name               | "External temperature"             |
        | measures[1].name               | "Battery2"                         |
        | measures[2].name               | "temperature"                      |
        | measures[3].name               | "battery"                          |

