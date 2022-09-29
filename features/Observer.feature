Feature: Observer

  Scenario: observe an asset document
    When I successfully execute the action "device-manager/asset":"create" with args:
      | engineId       | "engine-ayse" |
      | body.type      | "truck"       |
      | body.model     | "M"           |
      | body.reference | "asset_11"    |
    And I observe document "engine-ayse":"assets":"truck-M-asset_11"
    Then I should receive a result matching:
      | _source.reference | "asset_11" |
    When I successfully execute the action "device-manager/asset":"update" with args:
      | engineId       | "engine-ayse"      |
      | _id            | "truck-M-asset_11" |
      | body.reference | "asset_22"         |
    Then I should have a realtime object matching:
      | _source.reference | "asset_22" |
