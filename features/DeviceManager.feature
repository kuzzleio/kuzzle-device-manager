Feature: Device Manager Plugin

  # Custom mappings are defined in app.ts
  Scenario: Merge custom mappings
    When I successfully execute the action "collection":"getMapping" with args:
      | index      | "device-manager" |
      | collection | "devices"        |
    Then I should receive a result matching:
      | properties.metadata.properties.group.type                     | "keyword" |
      | properties.qos.properties.battery.type                        | "integer" |
      | properties.measures.properties.humidity.properties.value.type | "float"   |
    When I successfully execute the action "collection":"getMapping" with args:
      | index      | "tenant-ayse" |
      | collection | "assets"      |
    Then I should receive a result matching:
      | properties.measures.properties.humidity.properties.value.type                  | "float"   |
      | properties.measures.properties.humidity.properties.qos.properties.battery.type | "integer" |
      | properties.metadata.properties.warranty.type                                   | "keyword" |
    When I successfully execute the action "collection":"getMapping" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I should receive a result matching:
      | properties.payload.properties.deviceEUI.type | "keyword" |
    When I successfully execute the action "device-manager/engine":"create" with args:
      | index | "tenant-custom" |
      | group | "astronaut" |
    When I successfully execute the action "collection":"getMapping" with args:
      | index      | "tenant-custom" |
      | collection | "devices"        |
    Then I should receive a result matching:
      | properties.metadata.properties.awake.type                     | "boolean" |
      | properties.qos.properties.durability.type                     | "float"   |
      | properties.measures.properties.gravity.properties.value.type  | "float"   |
    When I successfully execute the action "collection":"getMapping" with args:
      | index      | "tenant-custom" |
      | collection | "assets"       |
    Then I should receive a result matching:
      | properties.metadata.properties.stillAlive.type                    | "boolean" |