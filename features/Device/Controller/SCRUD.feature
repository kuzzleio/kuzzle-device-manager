Feature: Device SCRUD

  # @todo
  Scenario: SCRUD device

  Scenario: create and update and get a device with dedicated API
    When I successfully execute the action "device-manager/devices":"create" with args:
      | engineId       | "device-manager" |
      | body.model     | "DummyTemp"      |
      | body.reference | "TOUPDATE"       |
    Then The document "device-manager":"devices":"DummyTemp-TOUPDATE" exists
    When I successfully execute the action "device-manager/devices":"update" with args:
      | engineId               | "device-manager"     |
      | _id                    | "DummyTemp-TOUPDATE" |
      | body.metadata.hostname | "2004000010"         |
    And I successfully execute the action "device-manager/devices":"get" with args:
      | engineId | "device-manager"     |
      | _id      | "DummyTemp-TOUPDATE" |
    Then I should receive a result matching:
      | model             | "DummyTemp"  |
      | reference         | "TOUPDATE"   |
      | metadata.hostname | "2004000010" |