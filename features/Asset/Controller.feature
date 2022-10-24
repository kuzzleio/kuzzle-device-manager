Feature: Asset Controller

  Scenario: SCRUD asset
    # Create
    When I successfully execute the action "device-manager/assets":"create" with args:
      | engineId       | "engine-kuzzle" |
      | body.model     | "container"     |
      | body.reference | "A1"            |
    Then The document "engine-kuzzle":"assets":"container-A1" exists
    # Update @todo activate when model metadata are done
    # When I successfully execute the action "device-manager/assets":"update" with args:
    #   | engineId             | "engine-kuzzle" |
    #   | _id                  | "container-A1"  |
    #   | body.metadata.height | 42              |
    # Then The document "engine-kuzzle":"assets":"container-A1" content match:
    #   | metadata.height | 42 |
    # Get
    When I successfully execute the action "device-manager/assets":"get" with args:
      | engineId | "engine-kuzzle" |
      | _id      | "container-A1"  |
    Then I should receive a result matching:
      # @todo activate when model metadata are done
      # | metadata.height | 42   |
      | _source.reference | "A1" |
    # Search
    Given I successfully execute the action "device-manager/assets":"create" with args:
      | engineId       | "engine-kuzzle" |
      | body.model     | "container"     |
      | body.reference | "B2"            |
    And I refresh the collection "engine-kuzzle":"assets"
    When I successfully execute the action "device-manager/assets":"search" with args:
      | engineId | "engine-kuzzle"                             |
      | body     | {"query":{"equals": { "reference": "A1" }}} |
      | size     | 1                                           |
      | lang     | "koncorde"                                  |
    Then I should receive a "hits" array of objects matching:
      | _id            |
      | "container-A1" |
    # Delete
    When I successfully execute the action "device-manager/assets":"delete" with args:
      | engineId | "engine-kuzzle" |
      | _id      | "container-A1"  |
    Then The document "engine-kuzzle":"assets":"container-A1" does not exists

  Scenario: Update linked device when deleting asset
    When I successfully execute the action "device-manager/assets":"delete" with args:
      | engineId | "engine-ayse"       |
      | _id      | "container-linked1" |
    Then The document "engine-ayse":"assets":"container-linked1" does not exist:
    And The document "device-manager":"devices":"DummyTemp-linked1" content match:
      | assetId | null |
    And The document "engine-ayse":"devices":"DummyTemp-linked1" content match:
      | assetId | null |

  Scenario: Get asset measures history
    Given I send the following "dummy-temp" payloads:
      | deviceEUI | temperature |
      | "linked1" | 42          |
      | "linked1" | 41          |
      | "linked1" | 40          |
    And I refresh the collection "engine-ayse":"measures"
    When I successfully execute the action "device-manager/assets":"getMeasures" with args:
      | engineId | "engine-ayse"       |
      | _id      | "container-linked1" |
      | size     | 2                   |
    Then I should receive a "measures" array of objects matching:
      | _source.values.temperature | _source.asset.id    | _source.origin.id   | _source.asset.model |
      | 40                         | "container-linked1" | "DummyTemp-linked1" | "container"         |
      | 41                         | "container-linked1" | "DummyTemp-linked1" | "container"         |

  Scenario: Push a measures in the asset, an other with different name and an older one
    When I successfully execute the action "device-manager/measures":"push" with args:
      | engineId                        | "engine-ayse"         |
      | body.assetId                    | "container-unlinked1" |
      | body.measure.type               | "temperature"         |
      | body.measure.values.temperature | 70                    |
      | body.measure.type               | "temperature"         |
      | body.measure.assetMeasureName   | "leftOuterTemp"       |
    Then The document "engine-ayse":"assets":"container-unlinked1" content match:
      | measures[0].type               | "temperature"   |
      | measures[0].deviceMeasureName  | null            |
      | measures[0].assetMeasureName   | "leftOuterTemp" |
      | measures[0].values.temperature | 70              |
      | measures[0].origin.type        | "user"          |
    # Push another with a different name
    When I successfully execute the action "device-manager/measures":"push" with args:
      | engineId                        | "engine-ayse"         |
      | body.assetId                    | "container-unlinked1" |
      | body.measure.type               | "temperature"         |
      | body.measure.values.temperature | -3                    |
      | body.measure.type               | "temperature"         |
      | body.measure.assetMeasureName   | "leftInnerTemp"       |
    Then The document "engine-ayse":"assets":"container-unlinked1" content match:
      | measures[0].type               | "temperature"   |
      | measures[0].deviceMeasureName  | null            |
      | measures[0].assetMeasureName   | "leftOuterTemp" |
      | measures[0].values.temperature | 70              |
      | measures[0].origin.type        | "user"          |
      | measures[1].type               | "temperature"   |
      | measures[1].deviceMeasureName  | null            |
      | measures[1].assetMeasureName   | "leftInnerTemp" |
      | measures[1].values.temperature | -3              |
      | measures[1].origin.type        | "user"          |
    # Replace the old "leftOuterTemp" measure
    When I successfully execute the action "device-manager/measures":"push" with args:
      | engineId                        | "engine-ayse"         |
      | body.assetId                    | "container-unlinked1" |
      | body.measure.type               | "temperature"         |
      | body.measure.values.temperature | 98                    |
      | body.measure.type               | "temperature"         |
      | body.measure.assetMeasureName   | "leftOuterTemp"       |
    Then The document "engine-ayse":"assets":"container-unlinked1" content match:
      | measures[0].type               | "temperature"   |
      | measures[0].deviceMeasureName  | null            |
      | measures[0].assetMeasureName   | "leftOuterTemp" |
      | measures[0].values.temperature | 98              |
      | measures[0].origin.type        | "user"          |
      | measures[1].type               | "temperature"   |
      | measures[1].deviceMeasureName  | null            |
      | measures[1].assetMeasureName   | "leftInnerTemp" |
      | measures[1].values.temperature | -3              |
      | measures[1].origin.type        | "user"          |
    Then I count 3 documents in "engine-ayse":"measures"

  # @todo maybe this should be forbidden after the measure name refactor
  Scenario: Push a measure without name use measure type as name
    When I successfully execute the action "device-manager/measures":"push" with args:
      | engineId                        | "engine-ayse"         |
      | body.assetId                    | "container-unlinked1" |
      | body.measure.type               | "temperature"         |
      | body.measure.values.temperature | 70                    |
      | body.measure.type               | "temperature"         |
    Then The document "engine-ayse":"assets":"container-unlinked1" content match:
      | measures[0].type               | "temperature" |
      | measures[0].deviceMeasureName  | null          |
      | measures[0].assetMeasureName   | "temperature" |
      | measures[0].values.temperature | 70            |
      | measures[0].origin.type        | "user"        |
