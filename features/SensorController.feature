Feature: Device Manager sensor controller

  Scenario: Create and delete a sensor
    When I successfully call the action "device-manager/sensor":"create" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | body.name                      | "sensor-01"                 |
      | _id                            | "sensor-01"                 |
    And I successfully call the action "device-manager/sensor":"list" with args:
      | index                          | "iot"                      |
    Then I count 1 documents in "iot":"sensor"
    And I successfully call the action "device-manager/sensor":"delete" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | _id                            | "sensor-01"                 |
    Then I count 0 documents in "iot":"sensor"

  Scenario: Create, link and try to delete a sensor before unlinking it and deleting it
    When I successfully call the action "device-manager/sensor":"create" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | body.name                      | "sensor-01"                 |
      | _id                            | "sensor-01"                 |
    And I successfully call the action "device-manager/asset":"create" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | body.name                      | "asset-01"                |
      | _id                            | "asset-01"                |
    And I successfully call the action "device-manager/sensor":"link" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | _id                            | "sensor-01"                 |
      | body.assetId                   | "asset-01"                |
    And I successfully call the action "device-manager/sensor":"list" with args:
      | index                          | "iot"                      |
    Then The property "hits[0]" of the result should match:
      | _id                            | "sensor-01"                 |
      | _source.name                   | "sensor-01"                 |
      | _source.assetId                | "asset-01"                |
    When I call the action "device-manager/sensor":"delete" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | _id                            | "sensor-01"                 |
    Then I should receive an error matching:
      | message                        | "sensor-01 is linked to asset-01." |
    When I call the action "device-manager/sensor":"unlink" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | _id                            | "sensor-01"                 |
    And I successfully call the action "device-manager/sensor":"delete" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | _id                            | "sensor-01"                 |
    And I successfully call the action "device-manager/asset":"delete" with args:
      | refresh                        | "wait_for"                 |
      | index                          | "iot"                      |
      | _id                            | "asset-01"                 |
    And I successfully call the action "device-manager/sensor":"list" with args:
      | index                          | "iot"                      |
    Then I count 0 documents in "iot":"sensor"
    And I successfully call the action "device-manager/asset":"list" with args:
      | index                          | "iot"                      |
    Then I count 0 documents in "iot":"asset"
