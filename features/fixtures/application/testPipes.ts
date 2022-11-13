import _ from "lodash";
import { Backend, KDocument } from "kuzzle";

import {
  MeasureContent,
  EventMeasureProcessBefore,
  AssetContent,
  DeviceContent
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
        measure.origin.id += `+${asset?._id}`;
      }

      return { asset, device, measures };
    }
  );
}
