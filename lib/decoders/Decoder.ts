import {
  JSONObject,
  KuzzleRequest,
  HttpRoute,
  PreconditionError,
} from 'kuzzle';
import _ from 'lodash';

import { Sensor, BaseAsset } from '../models';

import { AssetMeasures, SensorContent } from '../types';

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

/**
 * Base class to implement a decoder for a sensor model.
 * The sensor model must be passed to the parent constructor.
 * The abstract "decode" method must be implemented.
 */
export abstract class Decoder {
  private _http?: HttpRoute[];

  /**
   * Sensor model name
   */
  sensorModel: string;

  /**
   * Custom name for the associated API action in the "payload" controller
   */
  action?: string;

  /**
   * Custom mappings for the payload collection.
   * It will be injected in the "payload" property and it should allows to index
   * the device model unique identifier field.
   *
   * @example
   * this.payloadsMappings = {
   *   device_properties: {
   *     properties: {
   *       deveui: { type: 'keyword' }
   *     }
   *   }
   * }
   */
  payloadsMappings?: JSONObject = {};

  /**
   * Define custom HTTP routes
   *
   * @param http HttpRoute array
   */
  set http (http: HttpRoute[]) {
    this._http = http;
  }

  get http (): HttpRoute[] {
    return this._http || [{ verb: 'post', path: `device-manager/payload/${this.action}` }]
  }

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
  async validate (payload: JSONObject, request: KuzzleRequest): Promise<void> | never {
  }

  /**
   * Decode the payload:
   *  - set "reference"
   *  - fetch measures
   *  - fetch qos
   *
   * @param payload Raw payload received in the API action body
   * @param request Original request
   *
   * @returns Sensor content to save
   */
  abstract decode (payload: JSONObject, request: KuzzleRequest): Promise<SensorContent>

  /**
   * Hook executed before processing the payload but after validation
   *
   * @param payload Raw payload received in the API action body
   * @param request Original request
   */
  async beforeProcessing (payload: JSONObject, request: KuzzleRequest): Promise<void> {

  }

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
    return {
      tenantId: sensor._source.tenantId,
      sensor: sensor.serialize(),
      asset: null,
    };
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
  async afterUpdate (sensor: Sensor, asset: BaseAsset, request: KuzzleRequest): Promise<any> {
    return {
      tenantId: sensor._source.tenantId,
      sensor: sensor.serialize(),
      asset: asset ? asset.serialize() : null,
    };
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
        qos: sensor._source.qos,
      };
    }

    return measures;
  }

  /**
   * Checks if the provided properties are present in the payload
   *
   * @param payload Raw payload received in the API action body
   * @param paths Paths of properties (lodash style)
   *
   * @throws
   */
  ensureProperties (payload: JSONObject, paths: string[]): void | never {
    for (const path of paths) {
      if (! _.has(payload, path)) {
        throw new PreconditionError(`Missing property "${path}" in payload`);
      }
    }
  }
}

/* eslint-enable @typescript-eslint/no-unused-vars */
/* eslint-enable @typescript-eslint/no-empty-function */
