export const assetsHistoryMappings = {
  dynamic: "strict",
  properties: {
    type: { type: "keyword" },
    event: {
      properties: {
        names: { type: "keyword" },
        measure: {
          properties: {
            names: { type: 'keyword' },
          }
        },
        metadata: {
          properties: {
            names: { type: 'keyword' },
          }
        },
        link: {
          properties: {
            deviceId: { type: 'keyword' },
          }
        },
        unlink: {
          properties: {
            deviceId: { type: 'keyword' },
          }
        },
      }
    },
    id: { type: "keyword" },
    asset: {
      // populated with generated assets mappings

      properties: {
        _kuzzle_info: {
          properties: {
            author: { type: "keyword" },
            createdAt: { type: "date" },
            updatedAt: { type: "date" },
            updater: { type: "keyword" },
          }
        }
      }
     }
  }
};
