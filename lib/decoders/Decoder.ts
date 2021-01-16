import { JSONObject, KuzzleRequest } from 'kuzzle';
import _ from 'lodash';

import { Sensor, SensorContent } from '../models/Sensor';

import { AssetMeasures } from '../types/Measure';

// @todo use Kuzzle export
type HttpRoute = {
  /**
   * HTTP verb.
   */
  verb: 'get' | 'post' | 'put' | 'delete' | 'head',
  /**
   * Route path.
   * A route starting with `/` will be prefixed by `/_` otherwise the route
   * will be prefixed by `/_/<application-name>/`.
   */
  path: string
};

export abstract class Decoder {
  sensorModel: string;
  http?: HttpRoute[];
  action?: string;

  constructor (sensorModel: string) {
    this.sensorModel = sensorModel;
  }

  async validate (payload: JSONObject, request: KuzzleRequest): Promise<boolean> | never {
    return true;
  }

  abstract decode (payload: JSONObject, request: KuzzleRequest): Promise<SensorContent>

  async beforeRegister (sensor: Sensor, request: KuzzleRequest): Promise<Sensor> {
    return sensor;
  }

  async afterRegister (sensor: Sensor, request: KuzzleRequest): Promise<any> {
    return sensor.serialize();
  }

  async beforeUpdate (sensor: Sensor, request: KuzzleRequest): Promise<Sensor> {
    return sensor;
  }

  async afterUpdate (sensor: Sensor, request: KuzzleRequest): Promise<any> {
    return sensor.serialize();
  }

  async copyToAsset (sensor: Sensor): Promise<AssetMeasures> {
    const measures = {};

    for (const [measureType, measure] of Object.entries(sensor._source.measures)) {
      measures[measureType] = {
        id: sensor._id,
        model: sensor._source.model,
        manufacturerId: sensor._source.manufacturerId,
        ...measure,
        metadata: sensor._source.metadata,
      };
    }

    return measures;
  }
}
