Feature: Engine Controller

  Scenario: Create and delete an engine
    Given an index "tenant-kuzzle"
    When I successfully execute the action "device-manager/engines":"create" with args:
      | index | "tenant-kuzzle" |
    And I successfully execute the action "collection":"list" with args:
      | index | "tenant-kuzzle" |
    Then I should receive a result matching:
      | collections | [{"name":"assets","type":"stored"},{"name":"sensors","type":"stored"},{"name":"sensors-history","type":"stored"}] |
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
      | engines[0].index | "tenant-panja" |
      | engines[1].index | "tenant-kuzzle" |
