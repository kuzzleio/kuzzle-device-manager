Feature: Model Controller

  @models
  Scenario: Write and List an Asset model
    # Create model
    When I successfully execute the action "device-manager/models":"writeAsset" with args:
      | body.engineGroup      | "commons"                        |
      | body.model            | "Plane"                          |
      | body.metadataMappings | { company: { type: "keyword" } } |
      | body.measures[0].name | "temperatureExt"                 |
      | body.measures[0].type | "temperature"                    |
    Then The document "device-manager":"models":"model-asset-Plane" content match:
      | type                                | "asset"          |
      | engineGroup                         | "commons"        |
      | asset.model                         | "Plane"          |
      | asset.metadataMappings.company.type | "keyword"        |
      | asset.measures[0].name              | "temperatureExt" |
      | asset.measures[0].type              | "temperature"    |
    # Update model
    When I successfully execute the action "device-manager/models":"writeAsset" with args:
      | body.engineGroup      | "commons"                         |
      | body.model            | "Plane"                           |
      | body.metadataMappings | { company2: { type: "keyword" } } |
      | body.measures[0].name | "temperatureExt"                  |
      | body.measures[0].type | "temperature"                     |
      | body.measures[1].name | "position"                        |
      | body.measures[1].type | "position"                        |
    Then The document "device-manager":"models":"model-asset-Plane" content match:
      | type                                 | "asset"          |
      | engineGroup                          | "commons"        |
      | asset.model                          | "Plane"          |
      | asset.metadataMappings.company.type  | "keyword"        |
      | asset.metadataMappings.company2.type | "keyword"        |
      | asset.measures[0].name               | "temperatureExt" |
      | asset.measures[0].type               | "temperature"    |
      | asset.measures[1].name               | "position"       |
      | asset.measures[1].type               | "position"       |
    # This test fail when run with all the other but success when run individually
    # Then The collection "engine-ayse":"assets" mappings match:
    #   """
    #   {
    #     "linkedDevices": {
    #       "properties": {
    #         "id": {
    #           "type": "keyword"
    #         },
    #         "measures": {
    #           "type": "object",
    #           "dynamic": "false"
    #         }
    #       }
    #     },
    #     "measures": {
    #       "properties": {
    #         "position": {
    #           "properties": {
    #             "measuredAt": {
    #               "type": "date"
    #             },
    #             "payloadUuids": {
    #               "type": "keyword"
    #             },
    #             "type": {
    #               "type": "keyword"
    #             },
    #             "values": {
    #               "properties": {
    #                 "accuracy": {
    #                   "type": "float"
    #                 },
    #                 "altitude": {
    #                   "type": "float"
    #                 },
    #                 "position": {
    #                   "type": "geo_point"
    #                 }
    #               }
    #             }
    #           }
    #         },
    #         "temperatureExt": {
    #           "properties": {
    #             "measuredAt": {
    #               "type": "date"
    #             },
    #             "payloadUuids": {
    #               "type": "keyword"
    #             },
    #             "type": {
    #               "type": "keyword"
    #             },
    #             "values": {
    #               "properties": {
    #                 "temperature": {
    #                   "type": "float"
    #                 }
    #               }
    #             }
    #           }
    #         },
    #         "temperatureInt": {
    #           "properties": {
    #             "measuredAt": {
    #               "type": "date"
    #             },
    #             "payloadUuids": {
    #               "type": "keyword"
    #             },
    #             "type": {
    #               "type": "keyword"
    #             },
    #             "values": {
    #               "properties": {
    #                 "temperature": {
    #                   "type": "float"
    #                 }
    #               }
    #             }
    #           }
    #         }
    #       }
    #     },
    #     "metadata": {
    #       "properties": {
    #         "company": {
    #           "type": "keyword"
    #         },
    #         "company2": {
    #           "type": "keyword"
    #         },
    #         "height": {
    #           "type": "integer"
    #         },
    #         "person": {
    #           "properties": {
    #             "company": {
    #               "type": "keyword"
    #             }
    #           }
    #         },
    #         "size": {
    #           "type": "integer"
    #         },
    #         "surface": {
    #           "type": "integer"
    #         },
    #         "weight": {
    #           "type": "integer"
    #         }
    #       }
    #     },
    #     "model": {
    #       "type": "keyword",
    #       "fields": {
    #         "text": {
    #           "type": "text"
    #         }
    #       }
    #     },
    #     "reference": {
    #       "type": "keyword",
    #       "fields": {
    #         "text": {
    #           "type": "text"
    #         }
    #       }
    #     }
    #   }
    #   """
    When I successfully execute the action "device-manager/models":"listAssets" with args:
      | engineGroup | "commons" |
    Then I should receive a result matching:
      | total         | 3                       |
      | models[0]._id | "model-asset-Container" |
      | models[1]._id | "model-asset-Plane"     |
    When I successfully execute the action "device-manager/models":"getAsset" with args:
      | engineGroup | "commons" |
      | model       | "Plane"   |
    Then I should receive a result matching:
      | _id                 | "model-asset-Plane" |
      | _source.asset.model | "Plane"             |
    When I execute the action "device-manager/models":"getAsset" with args:
      | engineGroup | "other_engine" |
      | model       | "Plane"        |
    Then I should receive an error matching:
      | status | 404 |

  @models
  Scenario: Create an asset with default metadata values
    Given I successfully execute the action "device-manager/models":"writeAsset" with args:
      | body.engineGroup      | "commons"                                                                               |
      | body.model            | "Plane"                                                                                 |
      | body.metadataMappings | { size: { type: "integer" }, person: { properties: { company: { type: "keyword" } } } } |
      | body.defaultValues    | { "person.company": "Firebird" }                                                        |
    When I successfully execute the action "device-manager/assets":"create" with args:
      | engineId           | "engine-kuzzle" |
      | body.model         | "Plane"         |
      | body.reference     | "Dasha31"       |
      | body.metadata.size | 179             |
    Then The document "engine-kuzzle":"assets":"Plane-Dasha31" content match:
      | metadata.size           | 179        |
      | metadata.person.company | "Firebird" |

  @models
  Scenario: Error if the model name is not PascalCase
    Given I execute the action "device-manager/models":"writeAsset" with args:
      | body.engineGroup      | "commons"                     |
      | body.model            | "plane"                       |
      | body.metadataMappings | { size: { type: "integer" } } |
      | body.defaultValues    | { "name": "Firebird" }        |
    Then I should receive an error matching:
      | message | "Asset model \"plane\" must be PascalCase." |

  @models
  Scenario: Error if a default value is not a metadata
    Given I execute the action "device-manager/models":"writeAsset" with args:
      | body.engineGroup      | "commons"                     |
      | body.model            | "Plane"                       |
      | body.metadataMappings | { size: { type: "integer" } } |
      | body.defaultValues    | { "name": "Firebird" }        |
    Then I should receive an error matching:
      | message | "The default value \"name\" is not in the metadata mappings." |

  @models
  Scenario: Write and List a Device model
    When I successfully execute the action "device-manager/models":"writeDevice" with args:
      | body.model            | "Zigbee"                         |
      | body.measures[0].type | "battery"                        |
      | body.measures[0].name | "battery"                        |
      | body.metadataMappings | { network: { type: "keyword" } } |
    Then The document "device-manager":"models":"model-device-Zigbee" content match:
      | type                                 | "device"  |
      | device.model                         | "Zigbee"  |
      | device.metadataMappings.network.type | "keyword" |
    When I successfully execute the action "device-manager/models":"writeDevice" with args:
      | body.model            | "Zigbee"                          |
      | body.measures[0].type | "battery"                         |
      | body.measures[0].name | "battery"                         |
      | body.measures[1].type | "temperature"                     |
      | body.measures[1].name | "temperature"                     |
      | body.metadataMappings | { network2: { type: "keyword" } } |
    Then The document "device-manager":"models":"model-device-Zigbee" content match:
      | type                                  | "device"      |
      | device.model                          | "Zigbee"      |
      | device.metadataMappings.network.type  | "keyword"     |
      | device.metadataMappings.network2.type | "keyword"     |
      | device.measures[0].type               | "battery"     |
      | device.measures[0].name               | "battery"     |
      | device.measures[1].type               | "temperature" |
      | device.measures[1].name               | "temperature" |
    And I refresh the collection "device-manager":"models"
    Then The collection "engine-ayse":"devices" mappings match:
      """
      {
      "metadata": {
      "properties": {
      "color": {
      "type": "keyword"
      },
      "network": {
      "type": "keyword"
      },
      "network2": {
      "type": "keyword"
      }
      }
      },
      }
      """
    Then The collection "device-manager":"devices" mappings match:
      """
      {
      "metadata": {
      "properties": {
      "color": {
      "type": "keyword"
      },
      "network": {
      "type": "keyword"
      },
      "network2": {
      "type": "keyword"
      }
      }
      },
      }
      """
    When I successfully execute the action "device-manager/models":"listDevices"
    Then I should receive a result matching:
      | total         | 3                     |
      | models[2]._id | "model-device-Zigbee" |
    When I successfully execute the action "device-manager/models":"getDevice" with args:
      | model | "Zigbee" |
    Then I should receive a result matching:
      | _id                  | "model-device-Zigbee" |
      | _source.device.model | "Zigbee"              |

  @models
  Scenario: Error if the model name is not PascalCase
    Given I execute the action "device-manager/models":"writeDevice" with args:
      | body.engineGroup      | "commons"                     |
      | body.model            | "plane"                       |
      | body.metadataMappings | { size: { type: "integer" } } |
      | body.defaultValues    | { "name": "Firebird" }        |
      | body.measures[0].type | "temperature"                 |
      | body.measures[0].name | "temperature"                 |
    Then I should receive an error matching:
      | message | "Device model \"plane\" must be PascalCase." |

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
      """
      {
        "values": {
          "properties": {
            "presence": {
              "type": "boolean"
            },
            "presence2": {
              "type": "boolean"
            },
            "accuracy": {
              "type": "float"
            },
            "altitude": {
              "type": "float"
            },
            "battery": {
              "type": "integer"
            },
            "humidity": {
              "type": "float"
            },
            "movement": {
              "type": "boolean"
            },
            "position": {
              "type": "geo_point"
            },
            "temperature": {
              "type": "float"
            }
          }
        }
      }
      """
    When I successfully execute the action "device-manager/models":"writeDevice" with args:
      | body.model            | "Zigbee"   |
      | body.metadataMappings | {}         |
      | body.measures[0].type | "presence" |
      | body.measures[0].name | "presence" |
    Then The collection "engine-ayse":"devices" mappings match:
      """
      {
        "measures": {
          "properties": {
            "presence": {
              "properties": {
                "measuredAt": {
                  "type": "date"
                },
                "payloadUuids": {
                  "type": "keyword"
                },
                "type": {
                  "type": "keyword"
                },
                "values": {
                  "properties": {
                    "presence": {
                      "type": "boolean"
                    },
                    "presence2": {
                      "type": "boolean"
                    }
                  }
                }
              }
            }
          }
        }
      }
      """
    Then The collection "device-manager":"devices" mappings match:
      """
      {
        "measures": {
          "properties": {
            "presence": {
              "properties": {
                "measuredAt": {
                  "type": "date"
                },
                "payloadUuids": {
                  "type": "keyword"
                },
                "type": {
                  "type": "keyword"
                },
                "values": {
                  "properties": {
                    "presence": {
                      "type": "boolean"
                    },
                    "presence2": {
                      "type": "boolean"
                    }
                  }
                }
              }
            }
          }
        }
      }
      """
    When I successfully execute the action "device-manager/models":"listMeasures"
    Then I should receive a result matching:
      | total         | 7                        |
      | models[1]._id | "model-measure-battery"  |
      | models[5]._id | "model-measure-presence" |
    When I successfully execute the action "device-manager/models":"getMeasure" with args:
      | type | "battery" |
    Then I should receive a result matching:
      | _id                  | "model-measure-battery" |
      | _source.measure.type | "battery"               |

  Scenario: Register models from the framework
    Then The document "device-manager":"models":"model-asset-Container" content match:
      | type                               | "asset"          |
      | engineGroup                        | "commons"        |
      | asset.model                        | "Container"      |
      | asset.metadataMappings.weight.type | "integer"        |
      | asset.metadataMappings.height.type | "integer"        |
      | asset.measures[0].name             | "temperatureExt" |
      | asset.measures[0].type             | "temperature"    |
      | asset.measures[1].name             | "temperatureInt" |
      | asset.measures[1].type             | "temperature"    |
      | asset.measures[2].name             | "position"       |
      | asset.measures[2].type             | "position"       |
    Then The document "device-manager":"models":"model-asset-Warehouse" content match:
      | type                                | "asset"     |
      | engineGroup                         | "commons"   |
      | asset.model                         | "Warehouse" |
      | asset.metadataMappings.surface.type | "integer"   |
      | asset.measures[0].name              | "position"  |
      | asset.measures[0].type              | "position"  |
    Then The document "device-manager":"models":"model-device-DummyTemp" content match:
      | type                               | "device"      |
      | device.model                       | "DummyTemp"   |
      | device.metadataMappings.color.type | "keyword"     |
      | device.measures[0].name            | "temperature" |
      | device.measures[0].type            | "temperature" |
    Then The document "device-manager":"models":"model-measure-temperature" content match:
      | type                                    | "measure"     |
      | measure.type                            | "temperature" |
      | measure.valuesMappings.temperature.type | "float"       |
