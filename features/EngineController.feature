Feature: Engine Controller

  Scenario: Create and delete an engine
    Given an index "tenant-kuzzle"
    When I successfully execute the action "device-manager/engines":"create" with args:
      | index | "tenant-kuzzle" |
    And I successfully execute the action "collection":"list" with args:
      | index | "tenant-kuzzle" |
    Then I should receive a result matching:
      | collections | [{"name":"asset","type":"stored"},{"name":"measurement","type":"stored"},{"name":"sensor","type":"stored"}] |
    When I successfully execute the action "device-manager/engines":"delete" with args:
      | index | "tenant-kuzzle" |
    And I successfully execute the action "collection":"list" with args:
      | index | "tenant-kuzzle" |
    Then I should receive a result matching:
      | collections | [] |

  Scenario: List engines
    Given an index "tenant-kuzzle"
    And I successfully execute the action "device-manager/engines":"create" with args:
      | index | "tenant-kuzzle" |
    When I successfully execute the action "device-manager/engines":"list"
    Then I should receive a result matching:
      | engines[0].index | "tenant-kuzzle" |
