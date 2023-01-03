Feature: Default measures roles are registered

  Scenario: Find default measures roles
    Then The role "measures.reader" should match:
    """
      {
        "controllers": {
          "device-manager/models": {
            "actions": {
              "listMeasures": true,
            },
          },
        },
      }
    """
    Then The role "measures.admin" should match:
    """
      {
        "controllers": {
          "device-manager/models": {
            "actions": {
              "listMeasures": true,
              "writeMeasure": true,
              "deleteMeasure": true,
            },
          },
        },
      }
    """