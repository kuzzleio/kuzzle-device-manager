Feature: Default devices roles are registered

  Scenario: Find default devices roles
    Then The role "devices.reader" should match:
    """
      {
        "controllers": {
          "device-manager/devices": {
            "actions": {
              "get": true,
              "search": true,
            },
          },
          "device-manager/models": {
            "actions": {
              "listDevices": true,
            },
          },
        },
      }
    """
    Then The role "devices.admin" should match:
    """
      {
        "controllers": {
          "device-manager/devices": {
            "actions": {
              "create": true,
              "get": true,
              "update": true,
              "search": true,
              "delete": true,
              "linkAsset": true,
              "unlinkAsset": true,
            },
          },
          "device-manager/models": {
            "actions": {
              "listDevices": true,
              "writeDevice": true,
              "deleteDevice": true,
            },
          },
        },
      }
  """
