export const devicesAdmin = {
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
};
