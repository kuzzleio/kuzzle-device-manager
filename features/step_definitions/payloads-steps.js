const { Then } = require("cucumber");

// Delay in second for dates sent between two steps so the plugin accept the new
// Add a delay for subsequent payload of the same device so the plugin accept it
const deviceDelay = {};

Then(
  /I (try to )?send the following "(.*?)" payloads:/,
  async function (tryTo, action, dataTable) {
    const payloads = this.parseObjectArray(dataTable);

    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];

      if (deviceDelay[payload.reference]) {
        deviceDelay[payload.reference] += 2;
      } else {
        deviceDelay[payload.reference] = 1;
      }

      if (!payload.date) {
        const delay = deviceDelay[payload.reference] * 1000;
        payload.date = new Date(Date.now() + delay);
      }

      try {
        const { result } = await this.sdk.query({
          controller: "device-manager/payload",
          action,
          body: payload,
        });

        this.props.result = result;
      } catch (error) {
        if (!tryTo) {
          throw error;
        }

        this.props.error = error;
      }
    }
  }
);
