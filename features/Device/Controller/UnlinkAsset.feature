Feature: UnlinkAsset

  # @todo
  Scenario: Unlink the asset

  Scenario: Error when the device was not linked
    When I execute the action "device-manager/devices":"unlinkAsset" with args:
      | _id | "DummyMultiTemp-attached_ayse_unlinked_1" |
    Then I should receive an error matching:
      | message | "Device \"DummyMultiTemp-attached_ayse_unlinked_1\" is not linked to an asset." |
