Feature: Update device metadata

  Scenario: create and update and get a device with dedicated API
    When I successfully execute the action "device-manager/device":"create" with args:
      | engineId       | "device-manager" |
      | body.model     | "DummyTemp"      |
      | body.reference | "TOUPDATE"       |
    Then The document "device-manager":"devices":"DummyTemp-TOUPDATE" exists
    When I successfully execute the action "device-manager/device":"update" with args:
      | engineId               | "device-manager"     |
      | _id                    | "DummyTemp-TOUPDATE" |
      | body.metadata.hostname | "2004000010"         |
    And I successfully execute the action "device-manager/device":"get" with args:
      | engineId | "device-manager"     |
      | _id      | "DummyTemp-TOUPDATE" |
    Then I should receive a result matching:
      | model             | "DummyTemp"  |
      | reference         | "TOUPDATE"   |
      | metadata.hostname | "2004000010" |


  Scenario: create and update and get a device with standard API
    When I successfully execute the action "device-manager/device":"create" with args:
      | engineId       | "device-manager" |
      | body.model     | "DummyTemp"      |
      | body.reference | "TOUPDATE2"      |
    Then The document "device-manager":"devices":"DummyTemp-TOUPDATE2" exists
    When I successfully execute the action "document":"update" with args:
      | index         | "device-manager"                                                |
      | collection    | "devices"                                                       |
      | _id           | "DummyTemp-TOUPDATE2"                                           |
      | body.metadata | [ { "value": { "keyword": "2004000010" }, "key": "hostname" } ] |
    Then The document "device-manager":"devices":"DummyTemp-TOUPDATE2" content match:
      | metadata | [ { "value": { "keyword": "2004000010" }, "key": "hostname" } ] |