Feature: Get measures list

  Scenario: Get device measures history
    Given I send the following "dummy-temp" payloads:
      | deviceEUI | temperature |
      | "linked1" | 42          |
      | "linked1" | 41          |
      | "linked1" | 40          |
    And I refresh the collection "engine-ayse":"measures"
    When I successfully execute the action "device-manager/devices":"getMeasures" with args:
      | engineId  | "engine-ayse"                    |
      | _id       | "DummyTemp-linked1"              |
      | size      | 2                                |
      | body.sort | { "values.temperature": "desc" } |
    Then I should receive a result matching:
      | total           | 3 |
      | measures.length | 2 |
    Then I should receive a "measures" array of objects matching:
      | _source.values.temperature | _source.origin._id  |
      | 42                         | "DummyTemp-linked1" |
      | 41                         | "DummyTemp-linked1" |
    When I successfully execute the action "device-manager/devices":"getMeasures" with args:
      | engineId   | "engine-ayse"                            |
      | _id        | "DummyTemp-linked1"                      |
      | body.query | { equals: { "values.temperature": 40 } } |
    Then I should receive a "measures" array of objects matching:
      | _source.values.temperature | _source.origin._id  |
      | 40                         | "DummyTemp-linked1" |
    When I successfully execute the action "device-manager/devices":"getMeasures" with args:
      | engineId | "engine-ayse"       |
      | _id      | "DummyTemp-linked1" |
      | type     | "position"          |
    Then I should receive a result matching:
      | measures | [] |

