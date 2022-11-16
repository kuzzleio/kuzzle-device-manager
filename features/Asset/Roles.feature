Feature: Default assets roles are registered

  Scenario: Find default assets roles
    Then The role "assets.reader" should match:
    """
      {
        "controllers": {
          "device-manager/assets": {
            "actions": {
              "get": true,
              "search": true,
              "getMeasures": true,
            },
          },
          "device-manager/models": {
            "actions": {
              "listAssets": true,
            },
          },
        },
      }
    """
    Then The role "assets.admin" should match:
    """
    {
      "controllers": {
        "device-manager/assets": {
          "actions": {
            "*": true,
          },
        },
        "device-manager/models": {
          "actions": {
            "listAssets": true,
            "writeAsset": true,
            "deleteAsset": true,
          },
        },
      },
    }
    """