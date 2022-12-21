import _ from "lodash";
import { Backend, KDocument } from "kuzzle";
import should from "should";

import {
  MeasureContent,
  EventMeasureProcessBefore,
  AssetContent,
  DeviceContent,
} from "../../../index";

function checkEventWithDocument(app: Backend, event: string) {
  app.pipe.register(event, async (payload) => {
    app.log.debug(`Event "${event}" triggered`);

    await app.sdk.document.createOrReplace("tests", "events", event, payload);

    return payload;
  });
}

export function registerTestPipes(app: Backend) {
  app.pipe.register<EventMeasureProcessBefore>(
    "device-manager:measures:process:before",
    async ({
      asset,
      device,
      measures,
    }: {
      asset: KDocument<AssetContent>;
      device: KDocument<DeviceContent>;
      measures: MeasureContent[];
    }) => {
      if (device._id !== "DummyTemp-enrich_me_master") {
        return { asset, device, measures };
      }

      for (const measure of measures) {
        if (measure.values.temperature) {
          if (device._source.measures.temperature) {
            // Ensure the measure has not been integrated to the device yet
            should(measure.measuredAt).be.greaterThan(
              device._source.measures.temperature.measuredAt
            );
          }

          measure.values.temperature *= 2;
        }
      }

      return { asset, device, measures };
    }
  );
}
