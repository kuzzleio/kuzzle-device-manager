Feature: Detach device from engine

  Scenario: Detach device from an engine
    And I successfully execute the action "device-manager/devices":"attachEngine" with args:
      | _id      | "DummyTemp-detached1" |
      | engineId | "engine-kuzzle"       |
    When I successfully execute the action "device-manager/devices":"detachEngine" with args:
      | engineId | "engine-kuzzle"       |
      | _id      | "DummyTemp-detached1" |
    Then The document "device-manager":"devices":"DummyTemp-detached1" content match:
      | engineId | null |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached1" does not exists

  Scenario: Error if device is not attached
    When I execute the action "device-manager/devices":"detachEngine" with args:
      | engineId | "engine-ayse"         |
      | _id      | "DummyTemp-detached1" |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-detached1\" is not attached to an engine." |

  Scenario: Unlink the linked device
    When I successfully execute the action "device-manager/devices":"detachEngine" with args:
      | engineId | "engine-ayse"       |
      | _id      | "DummyTemp-linked1" |
    Then The document "engine-ayse":"assets":"Container-linked1" content match:
      | linkedDevices | [] |
    Then The document "device-manager":"devices":"DummyTemp-linked1" content match:
      | assetId | null |