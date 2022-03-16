Feature: Device Controller actions

  Scenario: Update a device
    When I successfully execute the action "device-manager/device":"attachEngine" with args:
      | _id   | "DummyTemp-detached" |
      | index | "engine-kuzzle"      |
    When I successfully execute the action "device-manager/device":"update" with args:
      | _id                          | "DummyTemp-detached" |
      | index                        | "engine-kuzzle"      |
      | body.metadata.updatedByTests | true                 |
    Then I successfully execute the action "collection":"refresh" with args:
      | index      | "engine-kuzzle" |
      | collection | "devices"       |
    Then The document "engine-kuzzle":"devices":"DummyTemp-detached" content match:
      | metadata.updatedByTests | true |

  Scenario: Clean payloads collection
    Given I successfully execute the action "collection":"truncate" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "12345" |
      | register55   | 23.3    |
      | batteryLevel | 0.8     |
    And I successfully receive a "dummy-temp-position" payload with:
      | deviceEUI     | "12345" |
      | register55    | 23.3    |
      | location.lat  | 42.2    |
      | location.lon  | 2.42    |
      | location.accu | 2100    |
    And I successfully execute the action "collection":"refresh" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I successfully execute the action "document":"search" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I should receive a result matching:
      | total | 2 |
    And I successfully execute the action "device-manager/device":"prunePayloads" with args:
      | body.days        | 0           |
      | body.deviceModel | "DummyTemp" |
    And I successfully execute the action "collection":"refresh" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I successfully execute the action "document":"search" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I should receive a result matching:
      | total | 1 |
