import _ from "lodash";
import { Backend } from "kuzzle";

import { MeasureContent } from "../../../lib/types";
import { BaseAsset, Device } from "../../../lib/models";

function checkEventWithDocument(app: Backend, event: string) {
  app.pipe.register(event, async (payload) => {
    app.log.debug(`Event "${event}" triggered`);

    await app.sdk.document.createOrReplace("tests", "events", event, payload);

    return payload;
  });
}

export function registerTestPipes(app: Backend) {
  app.pipe.register(

    "device-manager:measures:process:before",
    async ({
      asset,
      device,
      measures,
    }: {
      asset: BaseAsset;
      device: Device;
      measures: MeasureContent[];
    }) => {
      if (device._id !== "DummyMultiTemp-enrich_me_master") {
        return { asset, device, measures };
      }

      for (const measure of measures) {
        measure.origin.id += `+${asset?._id}`;
      }

      return { asset, device, measures };

    }
  );

  checkEventWithDocument(app, "device-manager:device:provisioning:before");
  checkEventWithDocument(app, "device-manager:device:provisioning:after");
  checkEventWithDocument(app, "device-manager:device:attach-engine:before");
  checkEventWithDocument(app, "device-manager:device:attach-engine:after");
  checkEventWithDocument(app, "device-manager:device:link-asset:before");
  checkEventWithDocument(app, "device-manager:device:link-asset:after");

  // Used in PayloadController.feature
  app.pipe.register(
    "engine:engine-ayse:asset:measures:new",
    async ({ asset, measures }) => {
      if (asset._id !== "tools-MART-linked") {
        return { asset, measures };
      }

      return { asset, measures };
    }
  );

  // Used in PayloadController.feature
  app.pipe.register(
    "engine:engine-ayse:device:measures:new",
    async ({ device, measures }) => {
      if (device._id !== "DummyTemp-attached_ayse_unlinked") {
        return { device, measures };
      }

      device._source.metadata = {
        enriched: true,
        measureTypes: measures.map((m) => m.type),
      };

      return { device, measures };
    }
  );
}
