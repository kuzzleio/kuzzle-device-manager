Feature: Measure propagation in Digital Twins

  Scenario: Propagate measures into device and linked asset
    When I send the following "dummy-temp" payloads:
      | deviceEUI | temperature |
      | "linked1" | 42.2        |
    Then The document "engine-ayse":"devices":"DummyTemp-linked1" content match:
      | measures[0].values.temperature | 42.2 |
    Then The document "engine-ayse":"assets":"container-linked1" content match:
      | measures[0].values.temperature | 42.2 |
