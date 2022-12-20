Feature: Asset Controller

  Scenario: SCRUD asset
    # Create
    When I successfully execute the action "device-manager/assets":"create" with args:
      | engineId             | "engine-kuzzle" |
      | body.model           | "Container"     |
      | body.reference       | "A1"            |
      | body.metadata.height | 5               |
    Then The document "engine-kuzzle":"assets":"Container-A1" content match:
      | metadata.height              | 5             |
      | metadata.weight              | null          |
      | measures.temperatureExt.type | "temperature" |
      | measures.temperatureInt.type | "temperature" |
      | measures.position.type       | "position"    |
      | linkedDevices                | []            |
    When I successfully execute the action "device-manager/assets":"update" with args:
      | engineId             | "engine-kuzzle" |
      | _id                  | "Container-A1"  |
      | body.metadata.weight | 1250            |
    Then The document "engine-kuzzle":"assets":"Container-A1" content match:
      | metadata.height | 5    |
      | metadata.weight | 1250 |
    # Get
    When I successfully execute the action "device-manager/assets":"get" with args:
      | engineId | "engine-kuzzle" |
      | _id      | "Container-A1"  |
    Then I should receive a result matching:
      | _source.metadata.height | 5    |
      | _source.reference       | "A1" |
    # Search
    Given I successfully execute the action "device-manager/assets":"create" with args:
      | engineId       | "engine-kuzzle" |
      | body.model     | "Container"     |
      | body.reference | "B2"            |
    And I refresh the collection "engine-kuzzle":"assets"
    When I successfully execute the action "device-manager/assets":"search" with args:
      | engineId | "engine-kuzzle"                             |
      | body     | {"query":{"equals": { "reference": "A1" }}} |
      | size     | 1                                           |
      | lang     | "koncorde"                                  |
    Then I should receive a "hits" array of objects matching:
      | _id            |
      | "Container-A1" |
    # Delete
    When I successfully execute the action "device-manager/assets":"delete" with args:
      | engineId | "engine-kuzzle" |
      | _id      | "Container-A1"  |
    Then The document "engine-kuzzle":"assets":"Container-A1" does not exists

  Scenario: Error when creating Asset from unknown model
    When I execute the action "device-manager/assets":"create" with args:
      | engineId       | "engine-kuzzle" |
      | body.model     | "truck"         |
      | body.reference | "BX98HZ"        |
    Then I should receive an error matching:
      | message | "Unknown Asset model \"truck\"." |

  Scenario: Update linked device when deleting asset
    When I successfully execute the action "device-manager/assets":"delete" with args:
      | engineId | "engine-ayse"       |
      | _id      | "Container-linked1" |
    Then The document "engine-ayse":"assets":"Container-linked1" does not exist:
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
      | _id      | "Container-linked1" |
      | size     | 2                   |
    Then I should receive a "measures" array of objects matching:
      | _source.values.temperature | _source.asset._id   | _source.origin._id  | _source.asset.model |
      | 40                         | "Container-linked1" | "DummyTemp-linked1" | "Container"         |
      | 41                         | "Container-linked1" | "DummyTemp-linked1" | "Container"         |

  Scenario: Push a measures in the asset, an other with different name and an older one
    When I successfully execute the action "device-manager/measures":"push" with args:
      | engineId                        | "engine-ayse"         |
      | body.assetId                    | "Container-unlinked1" |
      | body.measure.type               | "temperature"         |
      | body.measure.values.temperature | 26                    |
      | body.measure.type               | "temperature"         |
      | body.measure.name               | "temperatureExt"      |
    Then The document "engine-ayse":"assets":"Container-unlinked1" content match:
      | measures.temperatureExt.type               | "temperature" |
      | measures.temperatureExt.values.temperature | 26            |
    When I successfully execute the action "device-manager/measures":"push" with args:
      | engineId                        | "engine-ayse"         |
      | body.assetId                    | "Container-unlinked1" |
      | body.measure.type               | "temperature"         |
      | body.measure.values.temperature | -5                    |
      | body.measure.type               | "temperature"         |
      | body.measure.name               | "temperatureInt"      |
    Then The document "engine-ayse":"assets":"Container-unlinked1" content match:
      | measures.temperatureInt.type               | "temperature" |
      | measures.temperatureInt.values.temperature | -5            |
      | measures.temperatureExt.type               | "temperature" |
      | measures.temperatureExt.values.temperature | 26            |
    When I successfully execute the action "device-manager/measures":"push" with args:
      | engineId                        | "engine-ayse"         |
      | body.assetId                    | "Container-unlinked1" |
      | body.measure.type               | "temperature"         |
      | body.measure.values.temperature | 31                    |
      | body.measure.type               | "temperature"         |
      | body.measure.name               | "temperatureExt"      |
    Then The document "engine-ayse":"assets":"Container-unlinked1" content match:
      | measures.temperatureExt.values.temperature | 31 |
    Then I count 3 documents in "engine-ayse":"measures"

  Scenario: Push a measure without name use measure type as name
    When I successfully execute the action "device-manager/measures":"push" with args:
      | engineId                        | "engine-ayse"         |
      | body.assetId                    | "Container-unlinked1" |
      | body.measure.type               | "temperature"         |
      | body.measure.values.temperature | 70                    |
      | body.measure.name               | "temperatureExt"      |
    Then The document "engine-ayse":"assets":"Container-unlinked1" content match:
      | measures.temperatureExt.type               | "temperature"    |
      | measures.temperatureExt.name               | "temperatureExt" |
      | measures.temperatureExt.values.temperature | 70               |
