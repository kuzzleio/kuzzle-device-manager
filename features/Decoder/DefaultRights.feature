Feature: Device Manager Decoders

  Scenario: Creates default roles, profiles and users
    Then I am able to get a role with id "payload_gateway.dummy_temp"
    Then I am able to get a role with id "payload_gateway.dummy_temp_position"
    Then I am able to get a profile with id "payload_gateway.dummy_temp"
    Then I am able to get a profile with id "payload_gateway.dummy_temp_position"
    Then I am able to get a profile with id "payload_gateway"
    Then The user "payload_gateway.dummy_temp" exists
    Then The user "payload_gateway.dummy_temp_position" exists
    Then The user "payload_gateway" exists
