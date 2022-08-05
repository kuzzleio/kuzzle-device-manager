"use strict";

const { Then } = require("cucumber");
const axios = require("axios");

Then(
  /I (successfully )?execute the following HTTP request:/,
  async function (expectSuccess, dataTable) {
    const options = this.parseObject(dataTable);

    try {
      const response = await axios({
        method: options.method,
        url: `http://${this.host}:${this.port}${options.path}`,
        data: options.body,
        headers: options.headers,
      });

      this.props.response = {
        headers: response.headers,
        status: response.status,
        body: response.data,
      };
    } catch (error) {
      if (expectSuccess) {
        const kuzzleError = new Error(error.response.data.error.message);
        kuzzleError.stack = error.response.data.error.stack;

        throw kuzzleError;
      }

      this.props.response = {
        headers: error.response.headers,
        status: error.response.status,
        data: error.response.data,
      };
    }
  }
);

Then("I should receive a response matching:", function (dataTable) {
  const expectedResponse = this.parseObject(dataTable);

  should(this.props.response).matchObject(expectedResponse);
});
