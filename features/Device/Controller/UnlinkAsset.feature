Feature: UnlinkAsset

  Scenario: Unlink the asset
    When I execute the action "device-manager/devices":"unlinkAsset" with args:
      | engineId | "engine-ayse"       |
      | _id      | "DummyTemp-linked1" |
    Then The document "device-manager":"devices":"DummyTemp-linked1" content match:
      | assetId | null |
    And The document "engine-ayse":"devices":"DummyTemp-linked1" content match:
      | assetId | null |
    And The document "engine-ayse":"assets":"Container-linked1" content match:
      | linkedDevices.length | 0 |

  Scenario: Error when the device was not linked
    When I execute the action "device-manager/devices":"unlinkAsset" with args:
      | _id | "DummyTemp-unlinked1" |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-unlinked1\" is not linked to an asset." |

  Scenario: Unlink asset when deleting device
    When I execute the action "device-manager/devices":"delete" with args:
      | engineId | "engine-ayse"       |
      | _id      | "DummyTemp-linked1" |
    Then The document "engine-ayse":"assets":"Container-linked1" content match:
      | linkedDevices.length | 0 |
    And I refresh the collection "engine-ayse":"assets-history"
    Then I successfully execute the action "document":"search" with args:
      | index      | "engine-ayse"                      |
      | collection | "assets-history"                   |
      | body.sort  | {"_kuzzle_info.createdAt": "desc"} |
    And I should receive a result matching:
      | hits.length                                | 1                     |
      | hits[0]._source.id                         | "Container-linked1" |
      | hits[0]._source.type                       | "asset"               |
      | hits[0]._source.event.name                 | "unlink"              |
      | hits[0]._source.event.unlink.deviceId      | "DummyTemp-linked1" |
      | hits[0]._source.asset.linkedDevices        | []                    |

