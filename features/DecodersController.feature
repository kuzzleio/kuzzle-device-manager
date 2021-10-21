Feature: Device Manager decoders controller

  Scenario: List all registered decoders
    When When I successfully execute the action "device-manager/decoders":"list"
    Then I should receive a result matching:
      | decoders | [{"deviceModel":"DummyTemp","deviceMeasures":["temperature"]},{"deviceModel":"DummyTempPosition","deviceMeasures":["temperature","position"]}] |