Feature: Asset Historization

  Scenario: Historize asset after creation and metadata update
    When I successfully execute the action "device-manager/assets":"create" with args:
      | engineId             | "engine-kuzzle" |
      | body.model           | "Container"     |
      | body.reference       | "A1"            |
      | body.metadata.height | 5               |
    And I successfully execute the action "device-manager/assets":"update" with args:
      | engineId             | "engine-kuzzle" |
      | _id                  | "Container-A1"  |
      | body.metadata.weight | 1250            |
    And I refresh the collection "engine-kuzzle":"assets-history"
    Then I successfully execute the action "document":"search" with args:
      | index      | "engine-kuzzle"                    |
      | collection | "assets-history"                   |
      | body.sort  | {"_kuzzle_info.createdAt": "desc"} |
    And I should receive a result matching:
      | hits.length                           | 2                    |
      | hits[0]._source.id                    | "Container-A1"       |
      | hits[0]._source.event.name            | "metadata"           |
      | hits[0]._source.event.metadata.names  | ["weight"]           |
      | hits[0]._source.asset.metadata.height | 5                    |
      | hits[0]._source.asset.metadata.weight | 1250                 |
      | hits[1]._source.id                    | "Container-A1"       |
      | hits[1]._source.event.name            | "metadata"           |
      | hits[1]._source.event.metadata.names  | ["weight", "height"] |
      | hits[1]._source.asset.metadata.height | 5                    |
      | hits[1]._source.asset.metadata.weight | null                 |

  Scenario: Historize asset after being linked and unlinked
    When I successfully execute the action "device-manager/devices":"linkAsset" with args:
      | _id                         | "DummyTemp-unlinked1" |
      | assetId                     | "Container-unlinked1" |
      | engineId                    | "engine-ayse"         |
      | body.measureNames[0].device | "temperature"         |
      | body.measureNames[0].asset  | "temperatureExt"      |
    And I execute the action "device-manager/devices":"unlinkAsset" with args:
      | engineId | "engine-ayse"         |
      | _id      | "DummyTemp-unlinked1" |
    And I refresh the collection "engine-ayse":"assets-history"
    Then I successfully execute the action "document":"search" with args:
      | index      | "engine-ayse"                      |
      | collection | "assets-history"                   |
      | body.sort  | {"_kuzzle_info.createdAt": "desc"} |
    And I should receive a result matching:
      | hits.length                                | 2                     |
      | hits[0]._source.id                         | "Container-unlinked1" |
      | hits[0]._source.event.name                 | "unlink"              |
      | hits[0]._source.event.unlink.deviceId      | "DummyTemp-unlinked1" |
      | hits[0]._source.asset.linkedDevices        | []                    |
      | hits[1]._source.id                         | "Container-unlinked1" |
      | hits[1]._source.event.name                 | "link"                |
      | hits[1]._source.event.link.deviceId        | "DummyTemp-unlinked1" |
      | hits[1]._source.asset.linkedDevices[0]._id | "DummyTemp-unlinked1" |

  Scenario: Historize asset after receiving a new measure
    When I send the following "dummy-temp" payloads:
      | deviceEUI | temperature |
      | "linked1" | 42.2        |
    And I refresh the collection "engine-ayse":"assets-history"
    Then I successfully execute the action "document":"search" with args:
      | index      | "engine-ayse"                      |
      | collection | "assets-history"                   |
      | body.sort  | {"_kuzzle_info.createdAt": "desc"} |
    And I should receive a result matching:
      | hits.length                                                      | 1                   |
      | hits[0]._source.id                                               | "Container-linked1" |
      | hits[0]._source.event.name                                       | "measure"           |
      | hits[0]._source.event.measure.names                              | ["temperatureExt"]  |
      | hits[0]._source.event.metadata                                   | "_UNDEFINED_"       |
      | hits[0]._source.asset.measures.temperatureExt.values.temperature | 42.2                |

  Scenario: Historize asset when metadata have been updated when receiving a measure
    # A pipe will set the asset "weight" metadata to 42042
    When I send the following "dummy-temp" payloads:
      | deviceEUI | temperature | metadata.color                       |
      | "linked1" | 42.2        | "test-metadata-history-with-measure" |
    And I refresh the collection "engine-ayse":"assets-history"
    Then I successfully execute the action "document":"search" with args:
      | index      | "engine-ayse"                      |
      | collection | "assets-history"                   |
      | body.sort  | {"_kuzzle_info.createdAt": "desc"} |
    And I should receive a result matching:
      | hits.length                                                      | 1                   |
      | hits[0]._source.id                                               | "Container-linked1" |
      | hits[0]._source.event.name                                       | "measure"           |
      | hits[0]._source.event.measure.names                              | ["temperatureExt"]  |
      | hits[0]._source.event.metadata.names                             | ["weight"]          |
      | hits[0]._source.asset.measures.temperatureExt.values.temperature | 42.2                |
      | hits[0]._source.asset.metadata.weight                            | 42042               |
