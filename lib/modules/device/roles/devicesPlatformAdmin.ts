export const devicesPlatformAdmin = {
  controllers: {
    "device-manager/devices": {
      actions: {
        '*': true,
      },
    },
    "device-manager/models": {
      actions: {
        deleteDevice: true,
        listDevices: true,
        writeDevice: true,
      },
    },
  },
};
