Feature: Device Manager asset controller

  Scenario: Create and delete an asset
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/assets":"create" with args:
      | index          | "tenant-kuzzle" |
      | body.model     | "PERFO"         |
      | body.reference | "asset-01"      |
    Then The document "tenant-kuzzle":"assets":"PERFO/asset-01" exists
    And I successfully execute the action "device-manager/assets":"delete" with args:
      | index | "tenant-kuzzle"  |
      | _id   | "PERFO/asset-01" |
    Then The document "tenant-kuzzle":"assets":"PERFO/asset-01" does not exists

  # Scenario: Create, link and try to delete an asset before unlinking it and deleting it
  #   Given an engine on index "tenant-kuzzle"
  #   When I successfully execute the action "device-manager/asset":"create" with args:
  #     | refresh   | "wait_for"      |
  #     | index     | "tenant-kuzzle" |
  #     | body.name | "asset-01"      |
  #     | _id       | "asset-01"      |
  #   And I successfully execute the action "device-manager/sensor":"create" with args:
  #     | refresh   | "wait_for"      |
  #     | index     | "tenant-kuzzle" |
  #     | body.name | "sensor-01"     |
  #     | _id       | "sensor-01"     |
  #   And I successfully execute the action "device-manager/asset":"link" with args:
  #     | refresh       | "wait_for"      |
  #     | index         | "tenant-kuzzle" |
  #     | _id           | "asset-01"      |
  #     | body.sensorId | "sensor-01"     |
  #   And I successfully execute the action "device-manager/asset":"search" with args:
  #     | index | "tenant-kuzzle" |
  #   Then The property "hits[0]" of the result should match:
  #     | _id              | "asset-01"  |
  #     | _source.name     | "asset-01"  |
  #     | _source.sensorId | "sensor-01" |
  #   When I execute the action "device-manager/asset":"delete" with args:
  #     | refresh | "wait_for"      |
  #     | index   | "tenant-kuzzle" |
  #     | _id     | "asset-01"      |
  #   Then I should receive an error matching:
  #     | message | "asset-01 is linked to sensor-01." |
  #   When I execute the action "device-manager/asset":"unlink" with args:
  #     | refresh | "wait_for"      |
  #     | index   | "tenant-kuzzle" |
  #     | _id     | "asset-01"      |
  #   And I successfully execute the action "device-manager/asset":"delete" with args:
  #     | refresh | "wait_for"      |
  #     | index   | "tenant-kuzzle" |
  #     | _id     | "asset-01"      |
  #   And I successfully execute the action "device-manager/sensor":"delete" with args:
  #     | refresh | "wait_for"      |
  #     | index   | "tenant-kuzzle" |
  #     | _id     | "sensor-01"     |
  #   And I successfully execute the action "device-manager/asset":"search" with args:
  #     | index | "tenant-kuzzle" |
  #   Then I count 0 documents in "tenant-kuzzle":"asset"
  #   And I successfully execute the action "device-manager/sensor":"search" with args:
  #     | index | "tenant-kuzzle" |
  #   Then I count 0 documents in "tenant-kuzzle":"sensor"
