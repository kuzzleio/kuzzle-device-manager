import {
  HttpRoute,
  JSONObject,
  KuzzleRequest,
  PluginImplementationError,
  PreconditionError,
} from "kuzzle";
import _ from "lodash";

import { DecodedPayload } from "../types/DecodedPayload";
import { DecoderContent } from "../types";
import { MeasuresRegister } from "./registers/MeasuresRegister";

/* eslint-disable @typescript-eslint/no-unused-vars */
export type DecoderMeasures = Record<
  string, // deviceMeasureName
  string
>; // type

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
  public deviceModel: string;

  /**
   * Array of device measure and their type
   */
  public decoderMeasures: DecoderMeasures;

  /**
   * Custom name for the associated API action in the "payload" controller
   */
  public action?: string;

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
  public payloadsMappings?: JSONObject = {};

  /**
   * Define custom HTTP routes
   *
   * @param http HttpRoute array
   */
  set http(http: HttpRoute[]) {
    this._http = http;
  }

  get http(): HttpRoute[] {
    if (!this._http) {
      this._http = [
        { path: `device-manager/payload/${this.action}`, verb: "post" },
      ];
    }

    return this._http;
  }

  /**
   * @param deviceModel Device model for this decoder
   * @param decoderMeasures Measures created by this decoder
   *
   * @example
   * super('AbeewayGPS', ['position']);
   */
  constructor(
    deviceModel: string,
    decoderMeasures: DecoderMeasures,
    measuresRegister: MeasuresRegister
  ) {
    this.deviceModel = deviceModel;

    for (const [measureName, measureType] of Object.entries(decoderMeasures)) {
      if (!measuresRegister.has(measureType)) {
        throw new PluginImplementationError(
          `Decoder "${this.constructor.name}" cannot register unknown measure type "${measureType}"`
        );
      }
    }

    this.decoderMeasures = decoderMeasures;
  }

  /**
   * Validate the payload format before processing.
   *
   * If the method:
   *   - return true: the payload will be processed (status 200)
   *   - return false: the payload will be skipped (status 200)
   *   - throw an error: the payload will be skipped (status 4** or 5**)
   *
   * @param payload Raw payload received in the API action body
   * @param request Original request
   *
   * @return A boolean indicating if the payload is valid
   */
  // eslint-disable-next-line no-unused-vars
  async validate(
    payload: JSONObject,
    request: KuzzleRequest
  ): Promise<boolean> | never {
    return true;
  }

  /**
   * Decode the payload:
   *  - set "reference"
   *  - fetch measures
   *
   * @param payload Raw payload received in the API action body
   * @param request Original request
   *
   * @returns Map of `Measurements` by device reference.
   */
  // eslint-disable-next-line no-unused-vars
  abstract decode(
    payload: JSONObject,
    request: KuzzleRequest
  ): Promise<DecodedPayload>;

  /**
   * Checks if the provided properties are present in the payload
   *
   * @param payload Raw payload received in the API action body
   * @param paths Paths of properties (lodash style)
   *
   * @throws
   */
  ensureProperties(payload: JSONObject, paths: string[]): void | never {
    for (const path of paths) {
      if (!_.has(payload, path)) {
        throw new PreconditionError(`Missing property "${path}" in payload`);
      }
    }
  }

  serialize(): DecoderContent {
    return {
      decoderMeasures: this.decoderMeasures,
      deviceModel: this.deviceModel,
    };
  }
}

/* eslint-enable @typescript-eslint/no-unused-vars */
