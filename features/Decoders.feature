Feature: Device Manager Decoders

  Scenario: List all registered decoders
    When When I successfully execute the action "device-manager/decoders":"list"
    Then I should receive a result matching:
      | decoders | [{"deviceModel":"DummyTemp","deviceMeasures":["temperature"]},{"deviceModel":"DummyTempPosition","deviceMeasures":["temperature","position"]}] |

  Scenario: Creates default roles, profiles and users
    Then I am able to get a role with id "payload-gateway.dummy-temp"
    Then I am able to get a role with id "payload-gateway.dummy-temp-position"
    Then I am able to get a profile with id "payload-gateway.dummy-temp"
    Then I am able to get a profile with id "payload-gateway.dummy-temp-position"
    Then I am able to get a profile with id "payload-gateway"
    Then The user "payload-gateway.dummy-temp" exists
    Then The user "payload-gateway.dummy-temp-position" exists
    Then The user "payload-gateway" exists
