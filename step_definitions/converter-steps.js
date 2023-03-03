const _ = require("lodash"),
  should = require("should"),
  { When, Then } = require("cucumber");

When(
  /I (successfully )?execute the action "(.*?)":"(.*?)" with args:/,
  async function (expectSuccess, controller, action, dataTable) {
    const args = this.parseObject(dataTable);
    const query = JSON.stringify({ controller, action, ...args }, null, 2)

    if (expectSuccess) {
      global.converter.write(`
        await sdk.query(${query});
      `);
    }
    else {
      global.converter.write(`
        const promise = sdk.query(${query});
      `);
    }
  }
);

Then("I should receive an error matching:", function (dataTable) {
  const expectedError = this.parseObject(dataTable);

  global.converter.write(`
    expect(promise).rejects.toMatchObject(${JSON.stringify(expectedError, null, 2)})
  `);
});

Then(
  "I refresh the collection {string}:{string}",
  function (index, collection) {
    return this.sdk.collection.refresh(index, collection);
  }
);
