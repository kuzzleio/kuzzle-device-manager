Feature: Device Manager asset controller

  Scenario: Create, update and delete an asset
    When I successfully execute the action "device-manager/asset":"create" with args:
      | engineId       | "engine-kuzzle" |
      | body.type      | "outils"        |
      | body.model     | "PERFO"         |
      | body.reference | "asset_01"      |
    Then The document "engine-kuzzle":"assets":"outils-PERFO-asset_01" exists
    When I successfully execute the action "device-manager/asset":"update" with args:
      | engineId             | "engine-kuzzle"         |
      | _id                  | "outils-PERFO-asset_01" |
      | body.metadata.foobar | 42                      |
      | body.metadata.index  | "engine-kuzzle"         |
    And I successfully execute the action "device-manager/asset":"delete" with args:
      | engineId | "engine-kuzzle"         |
      | _id      | "outils-PERFO-asset_01" |
    Then The document "engine-kuzzle":"assets":"outils-PERFO-asset_01" does not exists

  Scenario: Import assets using csv
    When I successfully execute the action "device-manager/asset":"importAssets" with args:
      | engineId | "engine-kuzzle"                                |
      | body.csv | "reference,model,type\\nimported,PERFO,outils" |
    Then I successfully execute the action "collection":"refresh" with args:
      | index      | "engine-kuzzle" |
      | collection | "assets"        |
    Then The document "engine-kuzzle":"assets":"outils-PERFO-imported" content match:
      | reference | "imported" |
      | model     | "PERFO"    |

  Scenario: Retrieve asset measures history
    Given I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "attached_ayse_linked" |
      | register55   | 42.2                   |
      | batteryLevel | 0.4                    |
    Given I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "attached_ayse_linked" |
      | register55   | 21.1                   |
      | batteryLevel | 0.4                    |
    Given I successfully receive a "dummy-temp" payload with:
      | deviceEUI    | "attached_ayse_linked" |
      | register55   | 11.3                   |
      | batteryLevel | 0.4                    |
    Given I refresh the collection "engine-ayse":"measures"
    When I successfully execute the action "device-manager/asset":"measures" with args:
      | engineId | "engine-ayse"       |
      | _id      | "tools-MART-linked" |
      | size     | 5                   |
    # there is 6 measures with the 3 from fixtures
    Then I should receive a "measures" array of objects matching:
      | _source.origin.assetId | _source.origin.id                |
      | "tools-MART-linked"    | "DummyTemp-attached_ayse_linked" |
      | "tools-MART-linked"    | "DummyTemp-attached_ayse_linked" |
      | "tools-MART-linked"    | "DummyTemp-attached_ayse_linked" |
      | "tools-MART-linked"    | "DummyTemp-attached_ayse_linked" |
      | "tools-MART-linked"    | "DummyTemp-attached_ayse_linked" |

