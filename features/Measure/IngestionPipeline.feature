Feature: Ingestion Pipeline Events

  # Test the "device-manager:measures:process:before" event
  Scenario: Enrich a measure for a device linked to an asset with asset info
    Given I send the following "dummy-temp" payloads:
      | deviceEUI          | temperature |
      | "enrich_me_master" | 42.2        |
    Given I successfully execute the action "device-manager/devices":"attachEngine" with args:
      | _id      | "DummyTemp-enrich_me_master" |
      | engineId | "engine-ayse"                |
    Given I successfully execute the action "device-manager/devices":"linkAsset" with args:
      | _id                                         | "DummyTemp-enrich_me_master" |
      | assetId                                     | "container-unlinked1"        |
      | engineId                                    | "engine-ayse"                |
      | body.measureNamesLinks[0].assetMeasureName  | "temperature"                |
      | body.measureNamesLinks[0].deviceMeasureName | "temperature"                |
    Given I send the following "dummy-temp" payloads:
      | deviceEUI          | temperature |
      | "enrich_me_master" | 21.1        |
    And I refresh the collection "engine-ayse":"measures"
    Then When I successfully execute the action "document":"search" with args:
      | index      | "engine-ayse"                                        |
      | collection | "measures"                                           |
      | body       | { query: { term:{"asset.id":"container-unlinked1"}}} |
    And I should receive a "hits" array of objects matching:
      | _source.type  | _source.origin.id                                | _source.asset.model |
      | "temperature" | "DummyTemp-enrich_me_master+container-unlinked1" | "container"         |
    Then The document "device-manager":"devices":"DummyTemp-enrich_me_master" content match:
      | measures[0].origin.id | "DummyTemp-enrich_me_master+container-unlinked1" |
    Then The document "engine-ayse":"devices":"DummyTemp-enrich_me_master" content match:
      | measures[0].origin.id | "DummyTemp-enrich_me_master+container-unlinked1" |
    Then The document "engine-ayse":"assets":"container-unlinked1" content match:
      | measures[0].origin.id | "DummyTemp-enrich_me_master+container-unlinked1" |
