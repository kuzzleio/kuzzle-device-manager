const { Then } = require('cucumber');

Then(/I (successfully )?receive a "(.*?)" payload with:/, async function (expectSuccess, payloadType, dataTable) {
  const changes = this.parseObject(dataTable);

  const basePayload = JSON.parse(JSON.stringify(require(`../fixtures/payloads/${payloadType}`)));

  const payload = {
    ...basePayload,
    ...changes
  };

  try {
    const response = await this.sdk.query({
      controller: 'device-manager/payload',
      action: payloadType,
      body: payload
    });

    this.props.result = response.result;
  }
  catch (error) {
    if (expectSuccess) {
      throw error;
    }

    this.props.error = error;
  }
});
