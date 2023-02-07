Feature: Device Manager Decoders

  Scenario: Creates default roles, profiles and users
    Then I am able to get a role with id "payload_gateway"
    Then I am able to get a profile with id "payload_gateway"
    Then The user "payload_gateway" exists
