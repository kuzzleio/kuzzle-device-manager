Feature: UnlinkAsset

  Scenario: Unlink the asset
    When I execute the action "device-manager/devices":"unlinkAsset" with args:
      | engineId | "engine-ayse"       |
      | _id      | "DummyTemp-linked1" |
    Then The document "device-manager":"devices":"DummyTemp-linked1" content match:
      | assetId | null |
    And The document "engine-ayse":"devices":"DummyTemp-linked1" content match:
      | assetId | null |
    And The document "engine-ayse":"assets":"container-linked1" content match:
      | linkedDevices.length | 0 |

  Scenario: Error when the device was not linked
    When I execute the action "device-manager/devices":"unlinkAsset" with args:
      | _id | "DummyTemp-unlinked1" |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-unlinked1\" is not linked to an asset." |
