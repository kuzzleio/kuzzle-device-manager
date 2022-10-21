Feature: Device SCRUD

  # @todo
  Scenario: SCRUD device

  Scenario: create and update and get a device with dedicated API
    When I successfully execute the action "device-manager/device":"create" with args:
      | engineId       | "device-manager" |
      | body.model     | "DummyTemp"      |
      | body.reference | "TOUPDATE"       |
    Then The document "device-manager":"devices":"DummyTemp-TOUPDATE" exists
    When I successfully execute the action "device-manager/device":"update" with args:
      | engineId               | "device-manager"     |
      | _id                    | "DummyTemp-TOUPDATE" |
      | body.metadata.hostname | "2004000010"         |
    And I successfully execute the action "device-manager/device":"get" with args:
      | engineId | "device-manager"     |
      | _id      | "DummyTemp-TOUPDATE" |
    Then I should receive a result matching:
      | model             | "DummyTemp"  |
      | reference         | "TOUPDATE"   |
      | metadata.hostname | "2004000010" |