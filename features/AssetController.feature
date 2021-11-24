Feature: Device Manager asset controller

  Scenario: Create, update and delete an asset
    When I successfully execute the action "device-manager/asset":"create" with args:
      | index          | "tenant-kuzzle" |
      | body.type      | "outils"        |
      | body.model     | "PERFO"         |
      | body.reference | "asset_01"      |
    Then The document "tenant-kuzzle":"assets":"outils-PERFO-asset_01" exists
    When I successfully execute the action "device-manager/asset":"update" with args:
      | index                | "tenant-kuzzle"         |
      | _id                  | "outils-PERFO-asset_01" |
      | body.metadata.foobar | 42                      |
    And I successfully execute the action "device-manager/asset":"delete" with args:
      | index | "tenant-kuzzle"         |
      | _id   | "outils-PERFO-asset_01" |
    Then The document "tenant-kuzzle":"assets":"outils-PERFO-asset_01" does not exists

  Scenario: Import assets using csv
    When I successfully execute the action "device-manager/asset":"importAssets" with args:
      | index    | "tenant-kuzzle"                                       |
      | body.csv | "_id,reference,model\\nPERFO-imported,imported,PERFO" |
    Then I successfully execute the action "collection":"refresh" with args:
      | index      | "tenant-kuzzle" |
      | collection | "assets"         |
    Then The document "tenant-kuzzle":"assets":"PERFO-imported" content match:
      | reference | "imported" |
      | model     | "PERFO"    |
