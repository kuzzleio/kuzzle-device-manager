Feature: Import

  Scenario: Import devices using csv
    Given I successfully execute the action "device-manager/device":"importDevices" with args:
      | body.csv | "_id,reference,model\\nDummyTemp-imported,detached,DummyTemp_imported" |
    Then I successfully execute the action "collection":"refresh" with args:
      | index      | "device-manager" |
      | collection | "devices"        |
    Then The document "device-manager":"devices":"DummyTemp-imported" content match:
      | reference | "detached"           |
      | model     | "DummyTemp_imported" |

  Scenario: Import device catalog using csv
    Given a collection "device-manager":"config"
    And I "update" the document "plugin--device-manager" with content:
      | device-manager.provisioningStrategy | "catalog" |
    And I successfully execute the action "device-manager/device":"importCatalog" with args:
      | body.csv | "deviceId,authorized\\nDummyTemp-imported,false" |
    Then I successfully execute the action "collection":"refresh" with args:
      | index      | "device-manager" |
      | collection | "config"         |
    Then The document "device-manager":"config":"catalog--DummyTemp-imported" content match:
      | type               | "catalog"            |
      | catalog.authorized | false                |
      | catalog.deviceId   | "DummyTemp-imported" |
    And I "update" the document "plugin--device-manager" with content:
      | device-manager.provisioningStrategy | "auto" |
