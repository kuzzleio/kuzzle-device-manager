export const devicesReader = {
  controllers: {
    "device-manager/devices": {
      actions: {
        get: true,
        search: true,
      },
    },
    "device-manager/models": {
      actions: {
        listDevices: true,
      },
    },
  },
};
