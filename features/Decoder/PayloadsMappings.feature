Feature: Decoder

  @tenant-custom
  Scenario: Register custom mappings for payloads collection
    When I successfully execute the action "collection":"getMapping" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I should receive a result matching:
      | properties.payload.properties.deviceEUI.type | "keyword" |
