Feature: Device Manager Plugin

  # Custom mappings are defined in app.ts
  Scenario: Merge custom mappings
    When I successfully execute the action "collection":"getMapping" with args:
      | index      | "device-manager" |
      | collection | "sensors"        |
    Then I should receive a result matching:
      | properties.metadata.properties.battery.type                | "integer" |
      | properties.measures.properties.shock.properties.value.type | "float"   |
    When I successfully execute the action "collection":"getMapping" with args:
      | index      | "tenant-ayse" |
      | collection | "assets"      |
    Then I should receive a result matching:
      | properties.measures.properties.shock.properties.value.type                       | "float"   |
      | properties.measures.properties.shock.properties.metadata.properties.battery.type | "integer" |
      | properties.metadata.properties.warranty.type                                     | "keyword" |
