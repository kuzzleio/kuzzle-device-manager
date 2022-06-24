Feature: Detach device from engine

  Scenario: Detach device from an engine
    And I successfully execute the action "device-manager/device":"attachEngine" with args:
      | _id      | "DummyMultiTemp-detached" |
      | engineId | "engine-kuzzle"              |
    When I successfully execute the action "device-manager/device":"detachEngine" with args:
      | _id | "DummyMultiTemp-detached" |
    Then The document "device-manager":"devices":"DummyMultiTemp-detached" content match:
      | engineId | null |
    And The document "engine-kuzzle":"devices":"DummyMultiTemp-detached" does not exists

  Scenario: Detach multiple device to an engine using JSON
    When I successfully execute the action "device-manager/device":"mAttachEngines" with args:
      | body.records.0.engineId | "engine-kuzzle"                    |
      | body.records.0.deviceId | "DummyMultiTemp-detached"               |
      | body.records.1.engineId | "engine-kuzzle"                    |
      | body.records.1.deviceId | "DummyMultiTemp-attached_ayse_unlinked_1" |
    When I successfully execute the action "device-manager/device":"mDetachEngines" with args:
      | body.deviceIds | ["DummyMultiTemp-detached","DummyMultiTemp-attached_ayse_unlinked_1"] |
    Then The document "device-manager":"devices":"DummyMultiTemp-detached" content match:
      | engineId | null |
    Then The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | engineId | null |
    And The document "engine-kuzzle":"devices":"DummyMultiTemp-detached" does not exists
    And The document "engine-kuzzle":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" does not exists

  Scenario: Detach multiple device to an engine using CSV
    When I successfully execute the action "device-manager/device":"mAttachEngines" with args:
      | body.csv | "engineId,deviceId\\nengine-kuzzle,DummyMultiTemp-detached\\nengine-kuzzle,DummyMultiTemp-attached_ayse_unlinked_1," |
    When I successfully execute the action "device-manager/device":"mDetachEngines" with args:
      | body.csv | "deviceId\\nDummyMultiTemp-detached\\nDummyMultiTemp-attached_ayse_unlinked_1," |
    Then The document "device-manager":"devices":"DummyMultiTemp-detached" content match:
      | engineId | null |
    Then The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | engineId | null |
    And The document "engine-kuzzle":"devices":"DummyMultiTemp-detached" does not exists
    And The document "engine-kuzzle":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" does not exists

  Scenario: Error when detaching from an engine
    When I execute the action "device-manager/device":"detachEngine" with args:
      | _id    | "DummyMultiTemp-detached" |
      | strict | true                 |
    Then I should receive an error matching:
      | message | "Device \"DummyMultiTemp-detached\" is not attached to an engine." |
    When I execute the action "device-manager/device":"detachEngine" with args:
      | _id | "DummyMultiTemp-attached_ayse_linked_1" |
    Then I should receive an error matching:
      | message | "Device \"DummyMultiTemp-attached_ayse_linked_1\" is still linked to an asset." |
