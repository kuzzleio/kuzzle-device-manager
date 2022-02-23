Feature: Device Manager asset controller

  Scenario: Create, update and delete an asset
    When I successfully execute the action "device-manager/asset":"create" with args:
      | index          | "engine-kuzzle" |
      | body.type      | "outils"        |
      | body.model     | "PERFO"         |
      | body.reference | "asset_01"      |
    Then The document "engine-kuzzle":"assets":"outils-PERFO-asset_01" exists
    When I successfully execute the action "device-manager/asset":"update" with args:
      | index                | "engine-kuzzle"         |
      | _id                  | "outils-PERFO-asset_01" |
      | body.metadata.foobar | 42                      |
      | body.metadata.index  | "engine-kuzzle"         |
    And I successfully execute the action "device-manager/asset":"delete" with args:
      | index | "engine-kuzzle"         |
      | _id   | "outils-PERFO-asset_01" |
    Then The document "engine-kuzzle":"assets":"outils-PERFO-asset_01" does not exists

  Scenario: Create, update and modify with events before/after
    When I successfully execute the action "device-manager/asset":"create" with args:
      | index          | "engine-kuzzle" |
      | body.type      | "outils"        |
      | body.model     | "PERFO"         |
      | body.reference | "asset_01"      |
    Then The document "engine-kuzzle":"assets":"outils-PERFO-asset_01" exists
    When I successfully execute the action "device-manager/asset":"update" with args:
      | index                | "engine-kuzzle"         |
      | _id                  | "outils-PERFO-asset_01" |
      | body.metadata.foobar | 42                      |
      | body.metadata.index  | "engine-kuzzle"         |
    And The document "engine-kuzzle":"assets":"outils-PERFO-asset_01" content match:
      | metadata.enrichedByBeforeAssetUpdate | true |
    And The document "engine-kuzzle":"assets":"outils-PERFO-asset_01" content match:
      | metadata.enrichedByAfterAssetUpdate | true |

  Scenario: Import assets using csv
    When I successfully execute the action "device-manager/asset":"importAssets" with args:
      | index    | "engine-kuzzle"                                |
      | body.csv | "reference,model,type\\nimported,PERFO,outils" |
    Then I successfully execute the action "collection":"refresh" with args:
      | index      | "engine-kuzzle" |
      | collection | "assets"        |
    Then The document "engine-kuzzle":"assets":"outils-PERFO-imported" content match:
      | reference | "imported" |
      | model     | "PERFO"    |
