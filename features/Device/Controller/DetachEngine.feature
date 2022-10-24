Feature: Detach device from engine

  Scenario: Detach device from an engine
    And I successfully execute the action "device-manager/devices":"attachEngine" with args:
      | _id      | "DummyMultiTemp-detached" |
      | engineId | "engine-kuzzle"              |
    When I successfully execute the action "device-manager/devices":"detachEngine" with args:
      | _id | "DummyMultiTemp-detached" |
    Then The document "device-manager":"devices":"DummyMultiTemp-detached" content match:
      | engineId | null |
    And The document "engine-kuzzle":"devices":"DummyMultiTemp-detached" does not exists

  Scenario: Error when detaching from an engine
    When I execute the action "device-manager/devices":"detachEngine" with args:
      | _id    | "DummyMultiTemp-detached" |
      | strict | true                 |
    Then I should receive an error matching:
      | message | "Device \"DummyMultiTemp-detached\" is not attached to an engine." |
    When I execute the action "device-manager/devices":"detachEngine" with args:
      | _id | "DummyMultiTemp-attached_ayse_linked_1" |
    Then I should receive an error matching:
      | message | "Device \"DummyMultiTemp-attached_ayse_linked_1\" is still linked to an asset." |
