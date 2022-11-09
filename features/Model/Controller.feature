Feature: Model Controller

  @models
  Scenario: Write and List an Asset model
    When I successfully execute the action "device-manager/models":"writeAsset" with args:
      | body.engineGroup             | "commons"                        |
      | body.model                   | "plane"                          |
      | body.metadataMappings        | { company: { type: "keyword" } } |
      | body.measures.temperatureExt | "temperature"                    |
    Then The document "device-manager":"models":"model-asset-plane" content match:
      | type                                | "asset"       |
      | engineGroup                         | "commons"     |
      | asset.model                         | "plane"       |
      | asset.metadataMappings.company.type | "keyword"     |
      | asset.measures.temperatureExt       | "temperature" |
    When I successfully execute the action "device-manager/models":"writeAsset" with args:
      | body.engineGroup       | "commons"                         |
      | body.model             | "plane"                           |
      | body.metadataMappings  | { company2: { type: "keyword" } } |
      | body.measures.position | "position"                        |
    Then The document "device-manager":"models":"model-asset-plane" content match:
      | type                                 | "asset"       |
      | engineGroup                          | "commons"     |
      | asset.model                          | "plane"       |
      | asset.metadataMappings.company.type  | "keyword"     |
      | asset.metadataMappings.company2.type | "keyword"     |
      | asset.measures.temperatureExt        | "temperature" |
      | asset.measures.position              | "position"    |
    Then The collection "engine-ayse":"assets" mappings match:
    """
      {
        metadata: {
          properties: {
            company: { type: "keyword" },
            company2: { type: "keyword" },
          }
        },
        measures: {
          properties: {
            temperatureExt: {
              properties: {
                id: { type: "keyword" },
                type: { type: "keyword" },
                measuredAt: { type: "date" },
                value: { type: "float" },
              }
            },
            position: {
              properties: {
                id: { type: "keyword" },
                type: { type: "keyword" },
                measuredAt: { type: "date" },
                value: {
                  properties: {
                    lat: { type: "float" },
                    lon: { type: "float" },
                    accuracy: { type: "float" },
                  }
                },
              }
            },
          }
        }
      }
    """
    When I successfully execute the action "device-manager/models":"listAssets" with args:
      | engineGroup | "commons" |
    Then I should receive a result matching:
      | total         | 3                       |
      | models[0]._id | "model-asset-container" |
      | models[1]._id | "model-asset-plane"     |

  @models
  Scenario: Create an asset with default metadata values
    Given I successfully execute the action "device-manager/models":"writeAsset" with args:
      | body.engineGroup      | "commons"                                                                               |
      | body.model            | "plane"                                                                                 |
      | body.metadataMappings | { size: { type: "integer" }, person: { properties: { company: { type: "keyword" } } } } |
      | body.defaultValues    | { "person.company": "Firebird" }                                                        |
    When I successfully execute the action "device-manager/assets":"create" with args:
      | engineId           | "engine-kuzzle" |
      | body.model         | "plane"         |
      | body.reference     | "Dasha31"       |
      | body.metadata.size | 179             |
    Then The document "engine-kuzzle":"assets":"plane-Dasha31" content match:
      | metadata.size           | 179        |
      | metadata.person.company | "Firebird" |

  @models
  Scenario: Error if a default value is not a metadata
    Given I execute the action "device-manager/models":"writeAsset" with args:
      | body.engineGroup      | "commons"                     |
      | body.model            | "plane"                       |
      | body.metadataMappings | { size: { type: "integer" } } |
      | body.defaultValues    | { "name": "Firebird" }        |
    Then I should receive an error matching:
      | message | "The default value \"name\" is not in the metadata mappings." |

  @models
  Scenario: Write and List a Device model
    When I successfully execute the action "device-manager/models":"writeDevice" with args:
      | body.model            | "Zigbee"                         |
      | body.metadataMappings | { network: { type: "keyword" } } |
    Then The document "device-manager":"models":"model-device-Zigbee" content match:
      | type                                 | "device"  |
      | device.model                         | "Zigbee"  |
      | device.metadataMappings.network.type | "keyword" |
    When I successfully execute the action "device-manager/models":"writeDevice" with args:
      | body.model            | "Zigbee"                          |
      | body.metadataMappings | { network2: { type: "keyword" } } |
    Then The document "device-manager":"models":"model-device-Zigbee" content match:
      | type                                  | "device"  |
      | device.model                          | "Zigbee"  |
      | device.metadataMappings.network.type  | "keyword" |
      | device.metadataMappings.network2.type | "keyword" |
    And I refresh the collection "device-manager":"models"
    Then The collection "engine-ayse":"devices" mappings match:
      | properties.metadata.properties.network.type  | "keyword" |
      | properties.metadata.properties.network2.type | "keyword" |
    When I successfully execute the action "device-manager/models":"listDevices"
    Then I should receive a result matching:
      | total         | 3                     |
      | models[2]._id | "model-device-Zigbee" |

  @models
  Scenario: Write and List a Measure model
    When I successfully execute the action "device-manager/models":"writeMeasure" with args:
      | body.type           | "presence"                        |
      | body.valuesMappings | { presence: { type: "boolean" } } |
    Then The document "device-manager":"models":"model-measure-presence" content match:
      | type                                 | "measure"  |
      | measure.type                         | "presence" |
      | measure.valuesMappings.presence.type | "boolean"  |
    When I successfully execute the action "device-manager/models":"writeMeasure" with args:
      | body.type           | "presence"                         |
      | body.valuesMappings | { presence2: { type: "boolean" } } |
    Then The document "device-manager":"models":"model-measure-presence" content match:
      | type                                  | "measure"  |
      | measure.type                          | "presence" |
      | measure.valuesMappings.presence.type  | "boolean"  |
      | measure.valuesMappings.presence2.type | "boolean"  |
    And I refresh the collection "device-manager":"models"
    Then The collection "engine-ayse":"measures" mappings match:
      | properties.values.properties.presence.type  | "boolean" |
      | properties.values.properties.presence2.type | "boolean" |
    Then The collection "engine-ayse":"devices" mappings match:
      | properties.measures.properties.values.properties.presence.type  | "boolean" |
      | properties.measures.properties.values.properties.presence2.type | "boolean" |
    When I successfully execute the action "device-manager/models":"listMeasures"
    Then I should receive a result matching:
      | total         | 6                        |
      | models[0]._id | "model-measure-battery"  |
      | models[4]._id | "model-measure-presence" |

  Scenario: Register models from the framework
    Then The document "device-manager":"models":"model-asset-container" content match:
      | type                               | "asset"     |
      | engineGroup                        | "commons"   |
      | asset.model                        | "container" |
      | asset.metadataMappings.weight.type | "integer"   |
      | asset.metadataMappings.height.type | "integer"   |
    Then The document "device-manager":"models":"model-asset-warehouse" content match:
      | type                                | "asset"     |
      | engineGroup                         | "commons"   |
      | asset.model                         | "warehouse" |
      | asset.metadataMappings.surface.type | "integer"   |
    Then The document "device-manager":"models":"model-device-DummyTemp" content match:
      | type                               | "device"    |
      | device.model                       | "DummyTemp" |
      | device.metadataMappings.color.type | "keyword"   |
    Then The document "device-manager":"models":"model-measure-temperature" content match:
      | type                                    | "measure"     |
      | measure.name                            | "temperature" |
      | measure.valuesMappings.temperature.type | "float"       |
