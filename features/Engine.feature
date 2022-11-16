Feature: Engine Controller

  @reset-engines
  Scenario: Create and delete an engine
    Given an existing index "engine-kuzzle"
    When I successfully execute the action "collection":"list" with args:
      | index | "engine-kuzzle" |
    Then I should receive a result matching:
      | collections | [{"name":"assets","type":"stored"}, {"name":"config","type":"stored"},{"name":"devices","type":"stored"},{"name":"measures","type":"stored"}] |
    When I successfully execute the action "device-manager/engine":"delete" with args:
      | index | "engine-kuzzle" |
    And I successfully execute the action "collection":"list" with args:
      | index | "engine-kuzzle" |
    Then I should receive a result matching:
      | collections | [{"name":"config","type":"stored"}] |

