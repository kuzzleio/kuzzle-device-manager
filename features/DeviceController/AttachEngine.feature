Feature: Attach device to engine

  Scenario: Attach a device to an engine
    When I successfully execute the action "device-manager/device":"attachEngine" with args:
      | _id      | "DummyTemp-detached" |
      | engineId | "engine-kuzzle"      |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | engineId | "engine-kuzzle" |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached" exists

  Scenario: Attach a non-existing device to an engine should throw an error
    When I execute the action "device-manager/device":"attachEngine" with args:
      | _id      | "Not-existing-device" |
      | engineId | "engine-kuzzle"       |
    Then I should receive an error matching:
      | id | "services.storage.not_found" |

  Scenario: Attach a device to an engine and enrich it with event
    When I successfully execute the action "device-manager/device":"attachEngine" with args:
      | _id      | "DummyTemp-detached" |
      | engineId | "engine-kuzzle"      |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | engineId | "engine-kuzzle" |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached" exists
    # Events
    And The document "tests":"events":"device-manager:device:attach-engine:before" content match:
      | device._id | "DummyTemp-detached" |
      | engineId   | "engine-kuzzle"      |
    And The document "tests":"events":"device-manager:device:attach-engine:after" content match:
      | device._id | "DummyTemp-detached" |
      | engineId   | "engine-kuzzle"      |

  Scenario: Attach multiple device to an engine using JSON
    When I successfully execute the action "device-manager/device":"mAttachEngines" with args:
      | body.records.0.engineId | "engine-kuzzle"                    |
      | body.records.0.deviceId | "DummyTemp-detached"               |
      | body.records.1.engineId | "engine-kuzzle"                    |
      | body.records.1.deviceId | "DummyTemp-attached_ayse_unlinked" |
      | engineId | "engine-kuzzle" |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | engineId | "engine-kuzzle" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | engineId | "engine-kuzzle" |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached" exists
    And The document "engine-kuzzle":"devices":"DummyTemp-attached_ayse_unlinked" exists

  Scenario: Attach multiple device to an engine using CSV
    When I successfully execute the action "device-manager/device":"mAttachEngines" with args:
      | body.csv | "engineId,deviceId\\nengine-kuzzle,DummyTemp-detached\\nengine-kuzzle,DummyTemp-attached_ayse_unlinked," |
      | engineId | "engine-kuzzle"                                                                                          |
    Then The document "device-manager":"devices":"DummyTemp-detached" content match:
      | engineId | "engine-kuzzle" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | engineId | "engine-kuzzle" |
    And The document "engine-kuzzle":"devices":"DummyTemp-detached" exists
    And The document "engine-kuzzle":"devices":"DummyTemp-attached_ayse_unlinked" exists

  Scenario: Error when attaching a device to an engine
    When I execute the action "device-manager/device":"attachEngine" with args:
      | _id      | "DummyTemp-detached" |
      | engineId | "engine-kaliop"      |
    Then I should receive an error matching:
      | message | "Tenant \"engine-kaliop\" does not have a device-manager engine" |
    And I successfully execute the action "device-manager/device":"attachEngine" with args:
      | _id      | "DummyTemp-detached" |
      | engineId | "engine-kuzzle"      |
    When I execute the action "device-manager/device":"attachEngine" with args:
      | _id      | "DummyTemp-detached" |
      | engineId | "engine-kuzzle"      |
      | strict   | true                 |
    Then I should receive an error matching:
      | message | "Device \"DummyTemp-detached\" is already attached to an engine." |
