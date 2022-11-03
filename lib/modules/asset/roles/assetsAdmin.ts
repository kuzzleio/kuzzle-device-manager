export const assetsAdmin = {
  controllers: {
    "device-manager/assets": {
      actions: {
        "*": true,
      },
    },
    "device-manager/models": {
      actions: {
        deleteAsset: true,
        listAssets: true,
        writeAsset: true,
      },
    },
  },
};
