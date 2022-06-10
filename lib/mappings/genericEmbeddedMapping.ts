
// eslint-disable-next-line no-unused-vars
function embedded (mapping) {
  mapping.properties._kuzzleId = {
    fields: {
      text: { type: 'text' }
    },
    type: 'keyword'
  };
  return mapping;
}
