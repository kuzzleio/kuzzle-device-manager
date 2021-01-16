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
