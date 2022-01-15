Feature: Customization

  # Custom mappings are defined in app.ts
  @tenant-custom
  Scenario: Merge custom mappings
    # Check devices custom mappings
    When I successfully execute the action "collection":"getMapping" with args:
      | index      | "device-manager" |
      | collection | "devices"        |
    Then I should receive a result matching:
      | properties.metadata.properties.group.type                         | "keyword"   |
      | properties.metadata.properties.group2.type                        | "keyword"   |
      # default measures
      | properties.measures.properties.values.properties.humidity.type    | "float"     |
      | properties.measures.properties.values.properties.accuracy.type    | "float"     |
      | properties.measures.properties.values.properties.altitude.type    | "float"     |
      | properties.measures.properties.values.properties.position.type    | "geo_point" |
      | properties.measures.properties.values.properties.battery.type     | "integer"   |
      | properties.measures.properties.values.properties.temperature.type | "float"     |
      | properties.measures.properties.values.properties.movement.type    | "boolean"   |
    # Check assets custom mappings
    When I successfully execute the action "collection":"getMapping" with args:
      | index      | "tenant-ayse" |
      | collection | "assets"      |
    Then I should receive a result matching:
      | properties.measures.properties.values.properties.humidity.type    | "float"     |
      | properties.measures.properties.values.properties.accuracy.type    | "float"     |
      | properties.measures.properties.values.properties.altitude.type    | "float"     |
      | properties.measures.properties.values.properties.position.type    | "geo_point" |
      | properties.measures.properties.values.properties.battery.type     | "integer"   |
      | properties.measures.properties.values.properties.temperature.type | "float"     |
      | properties.measures.properties.values.properties.movement.type    | "boolean"   |
      | properties.metadata.properties.warranty.type                      | "keyword"   |
    When I successfully execute the action "collection":"getMapping" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I should receive a result matching:
      | properties.payload.properties.deviceEUI.type | "keyword" |
    When I successfully execute the action "device-manager/engine":"create" with args:
      | index | "tenant-custom" |
      | group | "astronaut"     |
    When I successfully execute the action "collection":"getMapping" with args:
      | index      | "tenant-custom" |
      | collection | "assets"        |
    Then I should receive a result matching:
      | properties.metadata.properties.stillAlive.type | "boolean" |
      | properties.metadata.properties.freezing.type   | "boolean" |
