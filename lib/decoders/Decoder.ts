import { JSONObject, KuzzleRequest } from 'kuzzle';

import { Sensor } from '../models';

import { AssetMeasures, SensorContent } from '../types';

/* eslint-disable @typescript-eslint/no-unused-vars */

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

/**
 * Base class to implement a decoder for a sensor model.
 * The sensor model must be passed to the parent constructor.
 * The abstract "decode" method must be implemented.
 */
export abstract class Decoder {
  sensorModel: string;
  http?: HttpRoute[];
  action?: string;

  /**
   * @param sensorModel Sensor model for this decoder
   */
  constructor (sensorModel: string) {
    this.sensorModel = sensorModel;
  }

  /**
   * Validate the payload format before processing.
   *
   * @param payload Raw payload received in the API action body
   * @param request Original request
   *
   * @throws BadRequestError if the payload is invalid
   */
  async validate (payload: JSONObject, request: KuzzleRequest): Promise<boolean> | never {
    return true;
  }

  /**
   * Decode the payload:
   *  - set "reference" and "model"
   *  - fetch measures
   *  - fetch metadata
   *
   * @param payload Raw payload received in the API action body
   * @param request Original request
   *
   * @returns Sensor content to save
   */
  abstract decode (payload: JSONObject, request: KuzzleRequest): Promise<SensorContent>

  /**
   * Enrichment hook executed before registering a sensor
   *
   * @param sensor Sensor before being persisted
   * @param request Original request
   *
   * @returns Enriched sensor
   */
  async beforeRegister (sensor: Sensor, request: KuzzleRequest): Promise<Sensor> {
    return sensor;
  }

  /**
   * Hook executed after registering a sensor.
   * Return value of this method will be returned in the API action result.
   *
   * @param sensor Sensor after being persisted
   * @param request Original request
   *
   * @returns Result of the corresponding API action
   */
  async afterRegister (sensor: Sensor, request: KuzzleRequest): Promise<any> {
    return sensor.serialize();
  }

   /**
   * Enrichment hook executed before updating a sensor
   *
   * @param sensor Sensor before being updated
   * @param request Original request
   *
   * @returns Enriched sensor
   */
  async beforeUpdate (sensor: Sensor, request: KuzzleRequest): Promise<Sensor> {
    return sensor;
  }

  /**
   * Hook executed after updating a sensor.
   * Return value of this method will be returned in the API action result.
   *
   * @param sensor Sensor after being updated
   * @param request Original request
   *
   * @returns Result of the corresponding API action
   */
  async afterUpdate (sensor: Sensor, request: KuzzleRequest): Promise<any> {
    return sensor.serialize();
  }

  /**
   * Build the "measures" property that will be persisted in the asset document
   *
   * @param sensor Sensor after being updated
   *
   * @returns Content of the "measures" property
   */
  async copyToAsset (sensor: Sensor): Promise<AssetMeasures> {
    const measures = {};

    for (const [measureType, measure] of Object.entries(sensor._source.measures)) {
      measures[measureType] = {
        id: sensor._id,
        model: sensor._source.model,
        reference: sensor._source.reference,
        ...measure,
        metadata: sensor._source.metadata,
      };
    }

    return measures;
  }
}

/* eslint-enable @typescript-eslint/no-unused-vars */
