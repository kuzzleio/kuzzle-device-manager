import _ from 'lodash';
import { Backend } from 'kuzzle';

import { MeasureContent } from '../../../lib/types';
import { BaseAsset, Device } from '../../../lib/models';

export function registerTestPipes (app: Backend) {

  /**
   * Checks the "device-manager:measures:receive" event.
   */
  app.pipe.register(
    'device-manager:measures:receive',
    async (measures: MeasureContent[], { asset, device }: { asset: BaseAsset, device: Device }) => {
      if (device._id !== 'DummyMultiTemp-enrich_me_master') {
        return measures;
      }

      for (const measure of measures) {
        measure.origin.id += `+${asset?._id}`;
      }

      return measures;
    });

}

