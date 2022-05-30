Feature:DeviceManager asset controller

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

  Scenario: Delete a linked asset
    When I successfully execute the action "device-manager/asset":"create" with args:
      | engineId       | "engine-ayse" |
      | body.type      | "outils"        |
      | body.model     | "PERFO"         |
      | body.reference | "asset_02"      |
    When I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id                            | "DummyTemp-attached_ayse_unlinked" |
      | assetId                        | "outils-PERFO-asset_02"             |
      | body.metadata.index  | "engine-ayse"         |
    When I successfully execute the action "device-manager/asset":"delete" with args:
      | engineId | "engine-ayse"         |
      | _id      | "outils-PERFO-asset_02" |
    Then The document "device-manager":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | null |
    And The document "engine-ayse":"devices":"DummyTemp-attached_ayse_unlinked" content match:
      | assetId | null |

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
    When I successfully execute the action "device-manager/asset":"getMeasures" with args:
      | engineId | "engine-ayse"       |
      | _id      | "tools-MART-linked" |
      | size     | 5                   |
    Then I should receive a "measures" array of objects matching:
    # there is 6 measures with the 3 from fixtures
      | _source.origin.assetId | _source.origin.id                |
      | "tools-MART-linked"    | "DummyTemp-attached_ayse_linked" |
      | "tools-MART-linked"    | "DummyTemp-attached_ayse_linked" |
      | "tools-MART-linked"    | "DummyTemp-attached_ayse_linked" |
      | "tools-MART-linked"    | "DummyTemp-attached_ayse_linked" |
      | "tools-MART-linked"    | "DummyTemp-attached_ayse_linked" |


  Scenario:Add a measure
    When I successfully execute the action "device-manager/asset":"postMeasures" with args:
      | engineId | "engine-ayse"       |
      | _id      | "tools-MART-linked" |
      | body     | { "measures": [ { "values": { "temperature": 70 }, "type": "temperature" }, { "values": { "nothing": null }, "type": "nonValidType" } ] } |
    Then I should receive a result matching:
      | asset           | { "_source": { "measures": [ { "values": { "temperature": 70 } } ] } }  |
      | engineId        | "engine-ayse"                                                           |
      | errors          | [ { "values": { "nothing": null }, "type": "nonValidType" } ]           |
    Then The document "engine-ayse":"assets":"tools-MART-linked" content match:
      | measures[0].type                | "temperature"           |
      | measures[0].values.temperature  | 70                      |
      | measures[0].origin.assetId      | "tools-MART-linked"     |
      | measures[0].origin.type         | "asset"                 |
      | measures[0].origin.type         | "asset"                 |
