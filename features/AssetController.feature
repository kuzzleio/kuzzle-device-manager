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
      | body.metadata.index  | "tenant-kuzzle"         |
    And I successfully execute the action "device-manager/asset":"delete" with args:
      | index | "tenant-kuzzle"         |
      | _id   | "outils-PERFO-asset_01" |
    Then The document "tenant-kuzzle":"assets":"outils-PERFO-asset_01" does not exists

  Scenario: Create, update and modify with events before/after
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
      | body.metadata.index  | "tenant-kuzzle"         |
    And The document "tenant-kuzzle":"assets":"outils-PERFO-asset_01" content match:
      | metadata.enrichedByBeforeAssetUpdate | true |
    And The document "tenant-kuzzle":"assets":"outils-PERFO-asset_01" content match:
      | metadata.enrichedByAfterAssetUpdate | true |


  Scenario: Import assets using csv
    When I successfully execute the action "device-manager/asset":"importAssets" with args:
      | index    | "tenant-kuzzle"                                |
      | body.csv | "reference,model,type\\nimported,PERFO,outils" |
    Then I successfully execute the action "collection":"refresh" with args:
      | index      | "tenant-kuzzle" |
      | collection | "assets"        |
    Then The document "tenant-kuzzle":"assets":"outils-PERFO-imported" content match:
      | reference | "imported" |
      | model     | "PERFO"    |
