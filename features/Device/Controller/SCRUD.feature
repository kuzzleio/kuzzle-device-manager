Feature: Device SCRUD

  # @todo
  Scenario: SCRUD device
    When I successfully execute the action "device-manager/devices":"create" with args:
      | engineId       | "device-manager" |
      | body.model     | "DummyTemp"      |
      | body.reference | "scrudme"        |
    Then The document "device-manager":"devices":"DummyTemp-scrudme" exists
    When I successfully execute the action "device-manager/devices":"update" with args:
      | engineId   | "device-manager"    |
      | _id        | "DummyTemp-scrudme" |
      | body.color | "RED"               |
    When I successfully execute the action "device-manager/devices":"get" with args:
      | engineId | "device-manager"    |
      | _id      | "DummyTemp-scrudme" |
    Then I should receive a result matching:
      | _source.model          | "DummyTemp" |
      | _source.reference      | "scrudme"   |
      | _source.metadata.color | "RED"       |
    Given I refresh the collection "device-manager":"devices"
    When I successfully execute the action "device-manager/devices":"search" with args:
      | engineId | "device-manager"                                |
      | _id      | "DummyTemp-scrudme"                             |
      | lang     | "koncorde"                                      |
      | body     | { query: { equals: { reference: "scrudme" } } } |
    Then I should receive a result matching:
      | hits[0]._source.reference      | "scrudme" |
      | hits[0]._source.metadata.color | "RED"     |
      | total                          | 1         |