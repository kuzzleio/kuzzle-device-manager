const { Then } = require('cucumber');
const { Observer } = require('kuzzle-sdk');

Then('I observe document {string}:{string}:{string}', async function (index, collection, document) {
  const observer = new Observer(this.sdk);
  const doc = await observer.get(index, collection, document, { 'test': 'ttt' });
  this.props.result = doc;
  this.props.realtime = doc;
});

