Feature: Detach device from engine

  Scenario: Detach device from an engine
    And I successfully execute the action "device-manager/device":"attachEngine" with args:
      | _id   | "DummyTemp-detached" |
      | index | "engine-kuzzle"      |
    When I successfully execute the action "device-manager/device":"detachEngine" with args:
      | _id | "DummyTemp-detached" |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | engineId | null |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached" does not exists

  Scenario: Detach multiple device to an engine using JSON
    When I successfully execute the action "device-manager/device":"mAttachEngines" with args:
      | body.records.0.engineId | "engine-kuzzle"                    |
      | body.records.0.deviceId | "DummyTemp-detached"               |
      | body.records.1.engineId | "engine-kuzzle"                    |
      | body.records.1.deviceId | "DummyTemp-attached_ayse_unlinked" |
    When I successfully execute the action "device-manager/device":"mDetachEngines" with args:
      | body.deviceIds | ["DummyTemp-detached","DummyTemp-attached_ayse_unlinked"] |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | engineId | null |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | engineId | null |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached" does not exists
    And The document "engine-kuzzle":"devices":"DummyTemp-attached_ayse_unlinked" does not exists

  Scenario: Detach multiple device to an engine using CSV
    When I successfully execute the action "device-manager/device":"mAttachEngines" with args:
      | body.csv | "engineId,deviceId\\nengine-kuzzle,DummyTemp-detached\\nengine-kuzzle,DummyTemp-attached_ayse_unlinked," |
    When I successfully execute the action "device-manager/device":"mDetachEngines" with args:
      | body.csv | "deviceId\\nDummyTemp-detached\\nDummyTemp-attached_ayse_unlinked," |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | engineId | null |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | engineId | null |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached" does not exists
    And The document "engine-kuzzle":"devices":"DummyTemp-attached_ayse_unlinked" does not exists

  Scenario: Error when detaching from an engine
    When I execute the action "device-manager/device":"detachEngine" with args:
      | _id    | "DummyTemp-detached" |
      | strict | true                 |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-detached\" is not attached to an engine." |
    Given I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id     | "DummyTemp-attached_ayse_unlinked" |
      | assetId | "tools-PERFO-unlinked"             |
    When I execute the action "device-manager/device":"detachEngine" with args:
      | _id | "DummyTemp-attached_ayse_unlinked" |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-attached_ayse_unlinked\" is still linked to an asset." |
