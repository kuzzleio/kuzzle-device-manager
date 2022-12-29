export const assetsHistoryMappings = {
  dynamic: "strict",
  properties: {
    type: { type: "keyword" },
    events: { type: "keyword" },
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
