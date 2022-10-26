Feature: Model Controller

  @models
  Scenario: Create an Asset model
    When I successfully execute the action "device-manager/models":"createAsset" with args:
      | body.engineGroup      | "engine-kaliop"                  |
      | body.model            | "plane"                          |
      | body.metadataMappings | { company: { type: "keyword" } } |
    Then The document "device-manager":"models":"model-asset-plane" content match:
      | type                                | "asset"         |
      | engineGroup                         | "engine-kaliop" |
      | asset.model                         | "plane"         |
      | asset.metadataMappings.company.type | "keyword"       |

  @models
  Scenario: Create a Device model
    When I successfully execute the action "device-manager/models":"createDevice" with args:
      | body.model            | "Zigbee"                         |
      | body.metadataMappings | { network: { type: "keyword" } } |
    Then The document "device-manager":"models":"model-device-Zigbee" content match:
      | type                                 | "device"  |
      | device.model                         | "Zigbee"  |
      | device.metadataMappings.network.type | "keyword" |

  @models
  Scenario: Create a Measure model
    When I successfully execute the action "device-manager/models":"createMeasure" with args:
      | body.name           | "presence"                        |
      | body.valuesMappings | { presence: { type: "boolean" } } |
    Then The document "device-manager":"models":"model-measure-presence" content match:
      | type                                 | "measure"  |
      | measure.name                         | "presence" |
      | measure.valuesMappings.presence.type | "boolean"  |

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
