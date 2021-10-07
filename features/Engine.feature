Feature: Engine Controller

  Scenario: Create and delete an engine
    Given an existing index "tenant-kuzzle"
    When I successfully execute the action "collection":"list" with args:
      | index | "tenant-kuzzle" |
    Then I should receive a result matching:
      | collections | [{"name":"assets","type":"stored"},{"name":"asset-history","type":"stored"}, {"name":"config","type":"stored"},{"name":"devices","type":"stored"}] |
    When I successfully execute the action "device-manager/engine":"delete" with args:
      | index | "tenant-kuzzle" |
    And I successfully execute the action "collection":"list" with args:
      | index | "tenant-kuzzle" |
    Then I should receive a result matching:
      | collections | [{"name":"config","type":"stored"}] |
