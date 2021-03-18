import {
  JSONObject,
  KuzzleRequest,
  HttpRoute,
  BadRequestError,
} from 'kuzzle';
import _ from 'lodash';

import { Device, BaseAsset } from '../models';

import { AssetMeasures, DeviceContent } from '../types';

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

/**
 * Base class to implement a decoder for a device model.
 * The device model must be passed to the parent constructor.
 * The abstract "decode" method must be implemented.
 */
export abstract class Decoder {
  private _http?: HttpRoute[];

  /**
   * Device model name
   */
  deviceModel: string;

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
   * @param deviceModel Device model for this decoder
   */
  constructor (deviceModel: string) {
    this.deviceModel = deviceModel;
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
   * @returns Device content to save
   */
  abstract decode (payload: JSONObject, request: KuzzleRequest): Promise<DeviceContent>

  /**
   * Hook executed before processing the payload but after validation
   *
   * @param payload Raw payload received in the API action body
   * @param request Original request
   */
  async beforeProcessing (payload: JSONObject, request: KuzzleRequest): Promise<void> {

  }

  /**
   * Enrichment hook executed before registering a device
   *
   * @param device Densor before being persisted
   * @param request Original request
   *
   * @returns Enriched device
   */
  async beforeRegister (device: Device, request: KuzzleRequest): Promise<Device> {
    return device;
  }

  /**
   * Hook executed after registering a device.
   * Return value of this method will be returned in the API action result.
   *
   * @param device Device after being persisted
   * @param request Original request
   *
   * @returns Result of the corresponding API action
   */
  async afterRegister (device: Device, request: KuzzleRequest): Promise<any> {
    return {
      tenantId: device._source.tenantId,
      device: device.serialize(),
      asset: null,
    };
  }

   /**
   * Enrichment hook executed before updating a device
   *
   * @param device Device before being updated
   * @param request Original request
   *
   * @returns Enriched device
   */
  async beforeUpdate (device: Device, request: KuzzleRequest): Promise<Device> {
    return device;
  }

  /**
   * Hook executed after updating a device.
   * Return value of this method will be returned in the API action result.
   *
   * @param device Device after being updated
   * @param request Original request
   *
   * @returns Result of the corresponding API action
   */
  async afterUpdate (device: Device, asset: BaseAsset, request: KuzzleRequest): Promise<any> {
    return {
      tenantId: device._source.tenantId,
      device: device.serialize(),
      asset: asset ? asset.serialize() : null,
    };
  }

  /**
   * Build the "measures" property that will be persisted in the asset document
   *
   * @param device Device after being updated
   *
   * @returns Content of the "measures" property
   */
  async copyToAsset (device: Device): Promise<AssetMeasures> {
    const measures = {};

    for (const [measureType, measure] of Object.entries(device._source.measures)) {
      measures[measureType] = {
        id: device._id,
        model: device._source.model,
        reference: device._source.reference,
        ...measure,
        qos: device._source.qos,
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
        throw new BadRequestError(`Missing property "${path}" in payload`);
      }
    }
  }
}

/* eslint-enable @typescript-eslint/no-unused-vars */
/* eslint-enable @typescript-eslint/no-empty-function */
