export const devicesAdmin = {
  controllers: {
    "device-manager/devices": {
      actions: {
        create: true,
        delete: true,
        get: true,
        linkAsset: true,
        search: true,
        unlinkAsset: true,
        update: true,
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
