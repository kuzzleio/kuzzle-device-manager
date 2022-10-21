Feature: Asset Controller

  # @todo
  Scenario: SCRUD asset
    When I successfully execute the action "device-manager/asset":"create" with args:
      | engineId       | "engine-kuzzle" |
      | body.type      | "outils"        |
      | body.model     | "PERFO"         |
      | body.reference | "asset_01"      |
    Then The document "engine-kuzzle":"assets":"outils-PERFO-asset_01" exists
    When I successfully execute the action "device-manager/asset":"update" with args:
      | engineId   | "engine-kuzzle"         |
      | _id        | "outils-PERFO-asset_01" |
      | body.model | "ALTMODEL"              |
    Then The document "engine-kuzzle":"assets":"outils-PERFO-asset_01" content match:
      | model | "ALTMODEL" |
    When I successfully execute the action "document":"update" with args:
      | index                | "engine-kuzzle"         |
      | collection           | "assets"                |
      | _id                  | "outils-PERFO-asset_01" |
      | options.prettify     | true                    |
      | body.metadata.foobar | 42                      |
      | body.metadata.index  | "engine-kuzzle"         |
      | body.model           | "PERFO"                 |
    When I successfully execute the action "device-manager/asset":"get" with args:
      | engineId | "engine-kuzzle"         |
      | _id      | "outils-PERFO-asset_01" |
    Then I should receive a result matching:
      | model           | "PERFO"         |
      | metadata.foobar | 42              |
      | metadata.index  | "engine-kuzzle" |
    And The document "engine-kuzzle":"assets":"outils-PERFO-asset_01" content match:
      | model                     | "PERFO"         |
      | metadata[0].key           | "foobar"        |
      | metadata[0].value.integer | 42              |
      | metadata[1].key           | "index"         |
      | metadata[1].value.keyword | "engine-kuzzle" |
    Then I refresh the collection "engine-kuzzle":"assets"
    When I successfully execute the action "device-manager/asset":"search" with args:
      | engineId | "engine-kuzzle"                                          |
      | body     | {"query":{"equals": { "_id": "outils-PERFO-asset_01" }}} |
      | size     | 1                                                        |
      | lang     | "koncorde"                                               |
    Then I should receive a "hits" array of objects matching:
      | _id                     | _source.model |
      | "outils-PERFO-asset_01" | "PERFO"       |
    When I successfully execute the action "device-manager/asset":"delete" with args:
      | engineId | "engine-kuzzle"         |
      | _id      | "outils-PERFO-asset_01" |
    Then The document "engine-kuzzle":"assets":"outils-PERFO-asset_01" does not exists

  Scenario: Update linked device when deleting asset
    When I successfully execute the action "device-manager/asset":"create" with args:
      | engineId       | "engine-ayse" |
      | body.type      | "outils"      |
      | body.model     | "PERFO"       |
      | body.reference | "asset_02"    |
    And I successfully execute the action "device-manager/device":"linkAsset" with args:
      | _id                 | "DummyMultiTemp-attached_ayse_unlinked_1" |
      | assetId             | "outils-PERFO-asset_02"                   |
      | body.metadata.index | "engine-ayse"                             |
      | engineId            | "engine-ayse"                             |
    And I successfully execute the action "device-manager/asset":"delete" with args:
      | engineId | "engine-ayse"           |
      | _id      | "outils-PERFO-asset_02" |
    Then The document "engine-ayse":"assets":"outils-PERFO-asset_02" does not exist:
    And The document "device-manager":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | null |
    And The document "engine-ayse":"devices":"DummyMultiTemp-attached_ayse_unlinked_1" content match:
      | assetId | null |

  Scenario: Get asset measures history
    Given I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI     | "attached_ayse_linked_1" |
      | payloads[0].registerInner | 42.2                     |
    And I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI     | "attached_ayse_linked_1" |
      | payloads[0].registerInner | 42.1                     |
    And I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI     | "attached_ayse_linked_1" |
      | payloads[0].registerInner | 42.0                     |
    And I refresh the collection "engine-ayse":"measures"
    When I successfully execute the action "device-manager/asset":"getMeasures" with args:
      | engineId | "engine-ayse"             |
      | _id      | "container-FRIDGE-linked" |
      | size     | 3                         |
    Then I should receive a "measures" array of objects matching:
      # there is 6 measures with the 3 from fixtures
      | _source.asset._id         | _source.origin.id                       | _source.asset._source.model |
      | "container-FRIDGE-linked" | "DummyMultiTemp-attached_ayse_linked_1" | "FRIDGE"                    |
      | "container-FRIDGE-linked" | "DummyMultiTemp-attached_ayse_linked_1" | "FRIDGE"                    |
      | "container-FRIDGE-linked" | "DummyMultiTemp-attached_ayse_linked_1" | "FRIDGE"                    |

  # @todo
  Scenario: Get a temporal slice of asset measures history
    Given I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI     | "attached_ayse_linked_1" |
      | payloads[0].registerInner | 42.2                     |
    And I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI     | "attached_ayse_linked_1" |
      | payloads[0].registerInner | 42.1                     |
    And I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI     | "attached_ayse_linked_1" |
      | payloads[0].registerInner | 42.0                     |
    And I refresh the collection "engine-ayse":"measures"
    When I successfully execute the action "device-manager/asset":"getMeasures" with args:
      | engineId | "engine-ayse"             |
      | _id      | "container-FRIDGE-linked" |
      | size     | 3                         |
    Then I should receive a "measures" array of objects matching:
      # there is 6 measures with the 3 from fixtures
      | _source.asset._id         | _source.origin.id                       | _source.asset._source.model |
      | "container-FRIDGE-linked" | "DummyMultiTemp-attached_ayse_linked_1" | "FRIDGE"                    |
      | "container-FRIDGE-linked" | "DummyMultiTemp-attached_ayse_linked_1" | "FRIDGE"                    |
      | "container-FRIDGE-linked" | "DummyMultiTemp-attached_ayse_linked_1" | "FRIDGE"                    |

  Scenario: Register a measures in the asset, an other with different name and an older one
    When I successfully execute the action "device-manager/asset":"pushMeasures" with args:
      | engineId | "engine-ayse"                                                                                                                                                                  |
      | _id      | "container-FRIDGE-unlinked_1"                                                                                                                                                  |
      | body     | { "measures": [ { "values": { "temperature": 70 }, "type": "temperature", "assetMeasureName": "leftOuterTemp" }, { "values": { "nothing": null }, "type": "nonValidType" } ] } |
    Then I should receive a result matching:
      | engineId | "engine-ayse"                                                                                       |
      | invalids | [ { "values": { "nothing": null }, "type": "nonValidType" } ]                                       |
      | valids   | [ { "values": { "temperature": 70 }, "type": "temperature", "assetMeasureName": "leftOuterTemp" } ] |
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | measures | [ { "type": "temperature", "deviceMeasureName": null, "assetMeasureName": "leftOuterTemp", "values": { "temperature": 70 }, "origin": { "type": "user" } } ] |
    When I successfully execute the action "device-manager/asset":"pushMeasures" with args:
      | engineId | "engine-ayse"                                                                                                                                                                  |
      | _id      | "container-FRIDGE-unlinked_1"                                                                                                                                                  |
      | body     | { "measures": [ { "values": { "temperature": -3 }, "type": "temperature", "assetMeasureName": "leftInnerTemp" }, { "values": { "nothing": null }, "type": "nonValidType" } ] } |
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | measures | [ { "assetMeasureName": "leftOuterTemp", "values": { "temperature": 70 } }, { "assetMeasureName": "leftInnerTemp", "values": { "temperature": -3 } } ] |
    When I successfully execute the action "device-manager/asset":"pushMeasures" with args:
      | engineId | "engine-ayse"                                                                                                                        |
      | _id      | "container-FRIDGE-unlinked_1"                                                                                                        |
      | body     | { "measures": [ { "measuredAt": 1, "values": { "temperature": 98 }, "type": "temperature", "assetMeasureName": "leftOuterTemp" } ] } |
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | measures | [ { "assetMeasureName": "leftOuterTemp", "values": { "temperature": 70 } }, { "assetMeasureName": "leftInnerTemp", "values": { "temperature": -3 } } ] |
    And I refresh the collection "engine-ayse":"measures"
    # 9 Existing measures from fixtures
    And I count 12 documents in "engine-ayse":"measures"

  Scenario: Register a measure without name
    When I successfully execute the action "device-manager/asset":"pushMeasures" with args:
      | engineId | "engine-ayse"                                                                  |
      | _id      | "container-FRIDGE-unlinked_1"                                                  |
      | body     | { "measures": [ { "values": { "temperature": 70 }, "type": "temperature" } ] } |
    Then The document "engine-ayse":"assets":"container-FRIDGE-unlinked_1" content match:
      | measures | [ { "type": "temperature", "deviceMeasureName": null, "assetMeasureName": "temperature", "values": { "temperature": 70 }, "origin": { "type": "user" } } ] |
