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
    },
    measurement: {
      properties: {
        metadata: {
          properties: {
            sensorId: {
              type: "keyword"
            },
            assetId: {
              type: "keyword"
            }
          }
        },
        type: {
          type: "keyword"
        },
        value: {
          type: "keyword"
        }
      }
    }
  }
};
