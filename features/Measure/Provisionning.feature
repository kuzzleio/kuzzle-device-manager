Feature: Device Provisionning

  Scenario: Create device with auto-provisionning
    Given I successfully execute the action "document":"update" with args:
      | index                                    | "device-manager"         |
      | collection                               | "config"                 |
      | _id                                      | "plugin--device-manager" |
      | body.device-manager.provisioningStrategy | "auto"                   |
    When I successfully receive a "dummy-multi-temp" payload with:
      | payloads[0].deviceEUI     | "didNotExist" |
      | payloads[0].registerInner | -10           |
      | payloads[0].registerOuter | 30            |
      | payloads[0].lvlBattery    | 0.9           |
    And I refresh the collection "device-manager":"devices"
    Then The document "device-manager":"devices":"DummyMultiTemp-didNotExist" exist
