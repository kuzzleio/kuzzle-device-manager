Feature: Attach device to engine

  Scenario: Attach a device to an engine and historize measures
    When I successfully execute the action "device-manager/devices":"attachEngine" with args:
      | _id      | "DummyMultiTemp-detached" |
      | engineId | "engine-kuzzle"           |
    Then The document "device-manager":"devices":"DummyMultiTemp-detached" content match:
      | engineId | "engine-kuzzle" |
    When I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI     | "detached" |
      | payloads[0].registerInner | -10        |
      | payloads[0].registerOuter | 30         |
      | payloads[0].lvlBattery    | 0.9        |
    Then I refresh the collection "engine-kuzzle":"measures"
    Then I count 3 documents in "engine-kuzzle":"measures"

  Scenario: Errors when attaching a device to an engine
    When I execute the action "device-manager/devices":"attachEngine" with args:
      | _id      | "Not-existing-device" |
      | engineId | "engine-kuzzle"       |
    Then I should receive an error matching:
      | id | "services.storage.not_found" |
    When I execute the action "device-manager/devices":"attachEngine" with args:
      | _id      | "DummyMultiTemp-detached" |
      | engineId | "engine-kaliop"           |
    Then I should receive an error matching:
      | message | "Tenant \"engine-kaliop\" does not have a device-manager engine" |
    And I successfully execute the action "device-manager/devices":"attachEngine" with args:
      | _id      | "DummyMultiTemp-detached" |
      | engineId | "engine-kuzzle"           |
    When I execute the action "device-manager/devices":"attachEngine" with args:
      | _id      | "DummyMultiTemp-detached" |
      | engineId | "engine-kuzzle"           |
      | strict   | true                      |
    Then I should receive an error matching:
      | message | "Device \"DummyMultiTemp-detached\" is already attached to an engine." |
