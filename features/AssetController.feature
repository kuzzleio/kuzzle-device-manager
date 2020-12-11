Feature: Device Manager asset controller

  Scenario: Create and delete an asset
    When I successfully call the action "device-manager/asset":"create" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | body.name                      | "asset-01"                 |
      | _id                            | "asset-01"                 |
    And I successfully call the action "device-manager/asset":"search" with args:
      | index                          | "iot"                      |
    Then I count 1 documents in "iot":"asset"
    And I successfully call the action "device-manager/asset":"delete" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | _id                            | "asset-01"                 |
    Then I count 0 documents in "iot":"asset"

  Scenario: Create, link and try to delete an asset before unlinking it and deleting it
    When I successfully call the action "device-manager/asset":"create" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | body.name                      | "asset-01"                 |
      | _id                            | "asset-01"                 |
    And I successfully call the action "device-manager/sensor":"create" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | body.name                      | "sensor-01"                |
      | _id                            | "sensor-01"                |
    And I successfully call the action "device-manager/asset":"link" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | _id                            | "asset-01"                 |
      | body.sensorId                  | "sensor-01"                |
    And I successfully call the action "device-manager/asset":"search" with args:
      | index                          | "iot"                      |
    Then The property "hits[0]" of the result should match:
      | _id                            | "asset-01"                 |
      | _source.name                   | "asset-01"                 |
      | _source.sensorId               | "sensor-01"                |
    When I call the action "device-manager/asset":"delete" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | _id                            | "asset-01"                 |
    Then I should receive an error matching:
      | message                        | "asset-01 is linked to sensor-01." |
    When I call the action "device-manager/asset":"unlink" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | _id                            | "asset-01"                 |
    And I successfully call the action "device-manager/asset":"delete" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | _id                            | "asset-01"                 |
    And I successfully call the action "device-manager/sensor":"delete" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | _id                            | "sensor-01"                 |
    And I successfully call the action "device-manager/asset":"search" with args:
      | index                          | "iot"                      |
    Then I count 0 documents in "iot":"asset"
    And I successfully call the action "device-manager/sensor":"search" with args:
      | index                          | "iot"                      |
    Then I count 0 documents in "iot":"sensor"
