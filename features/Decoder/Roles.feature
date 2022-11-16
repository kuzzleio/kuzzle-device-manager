Feature: Default decoders roles are registered

  Scenario: Find default decoders roles
    Then The role "decoders.admin" should match:
    """
      {
        "controllers": {
          "device-manager/decoders": {
            "actions": {
              "*": true,
            },
          },
        },
      }
    """
