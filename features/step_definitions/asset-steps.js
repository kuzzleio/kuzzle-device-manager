const { Then } = require('cucumber');

Then(/I (successfully )?receive a measure with:/, async function (expectSuccess, payloadType, dataTable) {
  const changes = this.parseObject(dataTable);

  const baseMeasure = JSON.parse(JSON.stringify(require(`../fixtures/measure`)));

  const measure = {
    ...baseMeasure,
    ...changes
  };

  try {
    const response = await this.sdk.query({
      controller: 'device-manager/asset',
      action: measure,
      body: measure,
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
