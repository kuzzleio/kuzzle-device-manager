Feature: Device Manager Decoders

  Scenario: Creates default roles, profiles and users
    Then I am able to get a role with id "payload-gateway.dummy-temp"
    Then I am able to get a role with id "payload-gateway.dummy-temp-position"
    Then I am able to get a profile with id "payload-gateway.dummy-temp"
    Then I am able to get a profile with id "payload-gateway.dummy-temp-position"
    Then I am able to get a profile with id "payload-gateway"
    Then The user "payload-gateway.dummy-temp" exists
    Then The user "payload-gateway.dummy-temp-position" exists
    Then The user "payload-gateway" exists
