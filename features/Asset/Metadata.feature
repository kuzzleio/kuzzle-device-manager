Feature: Register Asset Metadata

  # Custom mappings are defined in app.ts
  @tenant-custom
  Scenario: Register custom metadata for assets
    When I successfully execute the action "collection":"getMapping" with args:
      | index      | "engine-ayse" |
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
    # Check engine specific metadata
    When I successfully execute the action "device-manager/engine":"create" with args:
      | index | "tenant-custom" |
      | group | "astronaut"     |
    When I successfully execute the action "collection":"getMapping" with args:
      | index      | "tenant-custom" |
      | collection | "assets"        |
    Then I should receive a result matching:
      | properties.metadata.properties.stillAlive.type | "boolean" |
      | properties.metadata.properties.freezing.type   | "boolean" |
