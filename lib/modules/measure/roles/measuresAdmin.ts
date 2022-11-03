export const measuresAdmin = {
  controllers: {
    "device-manager/measures": {
      actions: {
        "*": true,
      },
    },
    "device-manager/models": {
      actions: {
        deleteMeasure: true,
        listMeasures: true,
        writeMeasure: true,
      },
    },
  },
};
