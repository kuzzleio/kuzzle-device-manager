Feature: Device Provisionning

  Scenario: Create device with auto-provisionning
    Given I successfully execute the action "document":"update" with args:
      | index                                    | "device-manager"         |
      | collection                               | "config"                 |
      | _id                                      | "plugin--device-manager" |
      | body.device-manager.provisioningStrategy | "auto"                   |
    When I send the following "dummy-temp" payloads:
      | deviceEUI | temperature |
      | "huwels" | 42.2        |
    Then The document "device-manager":"devices":"DummyTemp-huwels" exist
