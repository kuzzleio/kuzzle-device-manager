module.exports = {
  iot: {
    asset: {
      properties: {
        sensorId: {
          type: "keyword"
        }
      }
    },
    sensor: {
      properties: {
        assetId: {
          type: "keyword"
        }
      }
    }
  }
};
