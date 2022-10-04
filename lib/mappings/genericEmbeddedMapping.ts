//eslint-disable-next-line
function embedded(mapping) {
  mapping.properties._kuzzleId = {
    fields: {
      text: { type: "text" },
    },
    type: "keyword",
  };
  return mapping;
}
