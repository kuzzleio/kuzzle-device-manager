Feature: Device Manager sensor controller

  Scenario: Create and delete a sensor
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/sensor":"create" with args:
      | refresh   | "wait_for"      |
      | index     | "tenant-kuzzle" |
      | body.name | "sensor-01"     |
      | _id       | "sensor-01"     |
    And I successfully execute the action "device-manager/sensor":"search" with args:
      | index | "tenant-kuzzle" |
    Then I count 1 documents in "tenant-kuzzle":"sensor"
    And I successfully execute the action "device-manager/sensor":"delete" with args:
      | refresh | "wait_for"      |
      | index   | "tenant-kuzzle" |
      | _id     | "sensor-01"     |
    Then I count 0 documents in "tenant-kuzzle":"sensor"

  Scenario: Create, link and try to delete a sensor before unlinking it and deleting it
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/sensor":"create" with args:
      | refresh   | "wait_for"      |
      | index     | "tenant-kuzzle" |
      | body.name | "sensor-01"     |
      | _id       | "sensor-01"     |
    And I successfully execute the action "device-manager/asset":"create" with args:
      | refresh   | "wait_for"      |
      | index     | "tenant-kuzzle" |
      | body.name | "asset-01"      |
      | _id       | "asset-01"      |
    And I successfully execute the action "device-manager/sensor":"link" with args:
      | refresh      | "wait_for"      |
      | index        | "tenant-kuzzle" |
      | _id          | "sensor-01"     |
      | body.assetId | "asset-01"      |
    And I successfully execute the action "device-manager/sensor":"search" with args:
      | index | "tenant-kuzzle" |
    Then The property "hits[0]" of the result should match:
      | _id             | "sensor-01" |
      | _source.name    | "sensor-01" |
      | _source.assetId | "asset-01"  |
    When I execute the action "device-manager/sensor":"delete" with args:
      | refresh | "wait_for"      |
      | index   | "tenant-kuzzle" |
      | _id     | "sensor-01"     |
    Then I should receive an error matching:
      | message | "sensor-01 is linked to asset-01." |
    When I execute the action "device-manager/sensor":"unlink" with args:
      | refresh | "wait_for"      |
      | index   | "tenant-kuzzle" |
      | _id     | "sensor-01"     |
    And I successfully execute the action "device-manager/sensor":"delete" with args:
      | refresh | "wait_for"      |
      | index   | "tenant-kuzzle" |
      | _id     | "sensor-01"     |
    And I successfully execute the action "device-manager/asset":"delete" with args:
      | refresh | "wait_for"      |
      | index   | "tenant-kuzzle" |
      | _id     | "asset-01"      |
    And I successfully execute the action "device-manager/sensor":"search" with args:
      | index | "tenant-kuzzle" |
    Then I count 0 documents in "tenant-kuzzle":"sensor"
    And I successfully execute the action "device-manager/asset":"search" with args:
      | index | "tenant-kuzzle" |
    Then I count 0 documents in "tenant-kuzzle":"asset"

  Scenario: Push a measurement
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/sensor":"create" with args:
      | refresh   | "wait_for"      |
      | index     | "tenant-kuzzle" |
      | body.name | "sensor-01"     |
      | _id       | "sensor-01"     |
    And I successfully execute the action "device-manager/asset":"create" with args:
      | refresh   | "wait_for"      |
      | index     | "tenant-kuzzle" |
      | body.name | "asset-01"      |
      | _id       | "asset-01"      |
    And I successfully execute the action "device-manager/sensor":"link" with args:
      | refresh      | "wait_for"      |
      | index        | "tenant-kuzzle" |
      | _id          | "sensor-01"     |
      | body.assetId | "asset-01"      |
    And I successfully execute the action "device-manager/sensor":"push" with args:
      | refresh    | "wait_for"      |
      | index      | "tenant-kuzzle" |
      | body.type  | "temperature"   |
      | body.value | "42C"           |
      | _id        | "sensor-01"     |
    And I successfully execute the action "document":"search" with args:
      | index      | "tenant-kuzzle" |
      | collection | "measurement"   |
    Then The property "hits[0]" of the result should match:
      | _source.metadata.sensorId | "sensor-01"   |
      | _source.metadata.assetId  | "asset-01"    |
      | _source.type              | "temperature" |
      | _source.value             | "42C"         |