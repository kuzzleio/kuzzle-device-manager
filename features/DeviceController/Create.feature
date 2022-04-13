Feature: Device provisioning

  Scenario: Create a device in administration index
    When I successfully execute the action "device-manager/device":"create" with args:
      | engineId       | "device-manager" |
      | body.model     | "DummyTemp"      |
      | body.reference | "MATALE"         |
    Then The document "device-manager":"devices":"DummyTemp-MATALE" exists

  Scenario: Create a device in a device-manager engine and linked to an asset
    When I successfully execute the action "device-manager/device":"create" with args:
      | engineId       | "engine-ayse"          |
      | assetId        | "tools-PERFO-unlinked" |
      | body.model     | "DummyTemp"            |
      | body.reference | "MATALE"               |
    Then The document "device-manager":"devices":"DummyTemp-MATALE" content match:
      | assetId | "tools-PERFO-unlinked" |
    And The document "engine-ayse":"devices":"DummyTemp-MATALE" content match:
      | assetId | "tools-PERFO-unlinked" |

