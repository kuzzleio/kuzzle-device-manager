Feature: Decoders Controller

  Scenario: Prune payloads collection
    Given I successfully execute the action "document":"update" with args:
      | index                                    | "device-manager"         |
      | collection                               | "config"                 |
      | _id                                      | "plugin--device-manager" |
      | body.device-manager.provisioningStrategy | "auto"                   |
    Given I successfully execute the action "collection":"truncate" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    When I send the following "dummy-temp" payloads:
      | deviceEUI | temperature | metadata.color |
      | "12345"   | 23.1        | "RED"          |
    When I send the following "dummy-temp-position" payloads:
      | deviceEUI | temperature | location.lat | location.lon | location.accuracy | battery |
      | "12345"   | 23.3          | 42.2         | 2.42         | 2100              | 0.8     |
    And I successfully execute the action "collection":"refresh" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I successfully execute the action "document":"search" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I should receive a result matching:
      | total | 2 |
    And I successfully execute the action "device-manager/decoders":"prunePayloads" with args:
      | body.days        | 0           |
      | body.deviceModel | "DummyTemp" |
    And I successfully execute the action "collection":"refresh" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I successfully execute the action "document":"search" with args:
      | index      | "device-manager" |
      | collection | "payloads"       |
    Then I should receive a result matching:
      | total | 1 |
