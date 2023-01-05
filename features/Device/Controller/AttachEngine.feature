Feature: Attach device to engine

  Scenario: Attach a device to an engine and historize measures
    When I successfully execute the action "device-manager/devices":"attachEngine" with args:
      | _id      | "DummyTemp-detached1" |
      | engineId | "engine-kuzzle"       |
    Then The document "device-manager":"devices":"DummyTemp-detached1" content match:
      | engineId             | "engine-kuzzle" |
      | _kuzzle_info.updater | "-1"            |
    Then The document "engine-kuzzle":"devices":"DummyTemp-detached1" content match:
      | engineId            | "engine-kuzzle" |
      | _kuzzle_info.author | "-1"            |
    When I send the following "dummy-temp" payloads:
      | deviceEUI   | temperature |
      | "detached1" | 21          |
    Then I count 1 documents in "engine-kuzzle":"measures"

  Scenario: Errors when attaching a device to an engine
    When I execute the action "device-manager/devices":"attachEngine" with args:
      | _id      | "Not-existing-device" |
      | engineId | "engine-kuzzle"       |
    Then I should receive an error matching:
      | id | "services.storage.not_found" |
    When I execute the action "device-manager/devices":"attachEngine" with args:
      | _id      | "DummyTemp-detached1" |
      | engineId | "engine-kaliop"       |
    Then I should receive an error matching:
      | message | "Engine \"engine-kaliop\" does not exists." |
    And I successfully execute the action "device-manager/devices":"attachEngine" with args:
      | _id      | "DummyTemp-detached1" |
      | engineId | "engine-kuzzle"       |
    When I execute the action "device-manager/devices":"attachEngine" with args:
      | _id      | "DummyTemp-detached1" |
      | engineId | "engine-kuzzle"       |
      | strict   | true                  |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-detached1\" is already attached to an engine." |
