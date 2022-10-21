Feature: Register Device Metadata

  # Custom mappings are defined in app.ts
  @tenant-custom
  Scenario: Register custom metadata for devices
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
