Feature: Device Manager decoders controller

  Scenario: List all registered decoders
    When When I successfully execute the action "device-manager/decoders":"list"
    Then I should receive a result matching:
      | decoders | [{"payloadsMappings":{"deviceEUI":{"type":"keyword"}},"deviceModel":"DummyTemp","action":"dummy-temp"},{"payloadsMappings":{},"deviceModel":"DummyTempPosition","action":"dummy-temp-position"}] |