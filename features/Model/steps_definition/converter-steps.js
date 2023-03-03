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
        response = await sdk.query(${query});
      `);
    }
    else {
      global.converter.write(`
        promise = sdk.query(${query});
      `);
    }
  }
);

Then("I should receive a result matching:", function (dataTable) {
  const expectedResult = this.parseObject(dataTable);

  global.converter.write(`
    expect(response.result).toMatchObject(${JSON.stringify(expectedResult, null, 2)});
  `)
});


Then("I should receive an error matching:", function (dataTable) {
  const expectedError = this.parseObject(dataTable);

  global.converter.write(`
    await expect(promise).rejects.toMatchObject(${JSON.stringify(expectedError, null, 2)})
  `);
});

Then(
  "The document {string}:{string}:{string} content match:",
  async function (index, collection, documentId, dataTable) {
    const expectedContent = this.parseObject(dataTable);

    global.converter.write(`
      await expect(
        sdk.document.get("${index}", "${collection}", "${documentId}")
      ).resolves.toMatchObject({
        _source: ${JSON.stringify(expectedContent, null, 2)}
      });
    `);
  }
);

Then(
  "I refresh the collection {string}:{string}",
  function (index, collection) {
    global.converter.write(`
      await sdk.collection.refresh("${index}", "${collection}");
    `);
  }
);

Then(
  /I (try to )?send the following "(.*?)" payloads:/,
  async function (tryTo, action, dataTable) {
    const payloads = this.parseObjectArray(dataTable);

    global.converter.write(`
      await sendPayloads(sdk, "${action}", ${JSON.stringify(payloads, null, 2)})
    `);
  }
);

Then(
  "I should receive a {string} array of objects matching:",
  function (name, dataTable) {
    const expectedObjects = this.parseObjectArray(dataTable);

    for (let i = 0; i < expectedObjects.length; i++) {
      global.converter.write(`
        expect(response.result.${name}[${i}]).toMatchObject(${JSON.stringify(expectedObjects[i], null, 2)})
      `);
    }
  }
);

Then(
  /The document "(.*?)":"(.*?)":"(.*?)"( does not)? exist/,
  async function (index, collection, id, not) {
    global.converter.write(`
      await expect(sdk.document.exists("${index}", "${collection}", "${id}")).resolves.toBe(${not ? false : true})
    `);
  }
);

Then(
  "I count {int} documents in {string}:{string}",
  async function (expectedCount, index, collection) {
    global.converter.write(`
      await sdk.collection.refresh("${index}", "${collection}");
      await expect(sdk.document.count("${index}", "${collection}")).resolves.toBe(${expectedCount})
    `);
  }
);
