Feature: Device Manager asset controller

  Scenario: Create, update and delete an asset
    Given an engine on index "tenant-kuzzle"
    When I successfully execute the action "device-manager/asset":"create" with args:
      | index          | "tenant-kuzzle" |
      | body.type      | "outils"        |
      | body.model     | "PERFO"         |
      | body.reference | "asset-01"      |
    Then The document "tenant-kuzzle":"assets":"outils-PERFO-asset_01" exists
    When I successfully execute the action "device-manager/asset":"update" with args:
      | index                | "tenant-kuzzle"         |
      | _id                  | "outils-PERFO-asset_01" |
      | body.metadata.foobar | 42                      |
    And I successfully execute the action "device-manager/asset":"delete" with args:
      | index | "tenant-kuzzle"         |
      | _id   | "outils-PERFO-asset_01" |
    Then The document "tenant-kuzzle":"assets":"outils-PERFO-asset_01" does not exists
