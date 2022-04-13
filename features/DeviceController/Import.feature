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
