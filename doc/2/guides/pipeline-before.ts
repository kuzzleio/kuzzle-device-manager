import { Backend, KDocument } from "kuzzle";
import {
  EventMeasureProcessBefore,
  MeasureContent,
  DeviceContent,
  AssetContent,
} from "../../../index";

let app: Backend = {} as any;
const weatherApi: any = {};

app.pipe.register<EventMeasureProcessBefore>(
  "device-manager:measures:process:before",
  async ({ measures, device, asset }) => {
    for (const measure of measures) {
      if (measure.type === "power") {
        measure.values.watt = measure.values.volt * measure.values.ampere;
      }
    }

    return { measures, device, asset };
  }
);
app.pipe.register<EventMeasureProcessBefore>(
  "device-manager:measures:process:before",
  async ({ measures, device, asset }) => {
    const measuresCopy = [...measures];

    // Iterate on a copy because we are mutating the original array
    for (const measure of measuresCopy) {
      if (measure.type === "position") {
        const temperature = await weatherApi.getTemperature(
          measure.values.position
        );

        const temperatureMeasure: MeasureContent = {
          measuredAt: Date.now(),
          type: "temperature",
          asset: {
            _id: asset._id,
            measureName: "temperature",
            metadata: asset._source.metadata,
            model: asset._source.model,
            reference: asset._source.reference,
          },
          origin: {
            type: "computed",
            measureName: "temperature",
            _id: "weather-api",
            payloadUuids: measure.origin.payloadUuids,
          },
          values: { temperature },
        };

        // Add the new measure to the array so it will be persisted
        measures.push(temperatureMeasure);

        // Embed the new measure in the asset so it will be persisted
        asset._source.measures.temperature = {
          name: "temperature",
          type: "temperature",
          measuredAt: Date.now(),
          originId: "weather-api",
          values: { temperature },
          payloadUuids: measure.origin.payloadUuids,
        };
      }
    }

    return { measures, device, asset };
  }
);

app.pipe.register<EventMeasureProcessBefore>(
  "device-manager:measures:process:before",
  async ({ measures, device, asset }) => {
    for (const measure of measures) {
      if (measure.type === "battery" && measure.values.volts < 1.5) {
        asset._source.metadata.batteryLow = true;
      }
    }

    return { measures, device, asset };
  }
);
