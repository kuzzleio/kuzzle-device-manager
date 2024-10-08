import { HttpRoute, KuzzleRequest, PreconditionError } from "kuzzle";
import _ from "lodash";
import { JSONObject } from "kuzzle-sdk";

import { DecodedPayload } from "./DecodedPayload";
import { DecoderContent } from "./types/DecoderContent";

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Array of measures declaration
 *
 * This need to be read only so we can provide strong typing when decoding measures
 * with the DecodedPayload
 */
export type NamedMeasures = Array<{
  name: string;

  type: string;
}>;

/**
 * Base class to implement a decoder for a device model.
 * The device model must be passed to the parent constructor.
 * The abstract "decode" method must be implemented.
 */
export abstract class Decoder {
  private _http?: HttpRoute[];

  /**
   * Internal logger.
   */
  public log: {
    debug: (message: any) => void;
    error: (message: any) => void;
    info: (message: any) => void;
    silly: (message: any) => void;
    verbose: (message: any) => void;
    warn: (message: any) => void;
  };
  /**
   * Device model name.
   *
   * Will be infered from the class name if not defined:
   * `AbeewayGPSDecoder` => `AbeewayGPS`
   */
  public deviceModel: string;

  /**
   * Declaration of the measures decoded by this decoder.
   * The name correspond of the measure name for the device.
   * Measures types should be registered on the plugin beforehand.
   *
   * @example
   *
   * this.measures = [
   *   { type: 'temperature', name: 'temperatureExterior' },
   * ];
   */
  public measures: ReadonlyArray<NamedMeasures[0]> = [];

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
   *
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
        {
          openapi: {
            description: `Receive a payload from a ${this.deviceModel} device`,
            parameters: [
              {
                in: "body",
                name: "payload",
                required: true,
                schema: {
                  type: "object",
                },
              },
            ],
          },
          path: `device-manager/payload/${this.action}`,
          verb: "post",
        },
      ];
    }

    return this._http;
  }

  get measureNames(): string[] {
    return this.measures.map(({ name }) => name);
  }

  get measureTypes(): string[] {
    return this.measures.map(({ type }) => type);
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
    request: KuzzleRequest,
  ): Promise<boolean> | never {
    return true;
  }

  /**
   * Decode the payload:
   *  - set "reference"
   *  - fetch measures
   *
   * @param decodedPayload Decoded payload to store decoded measures
   * @param payload Raw payload received in the API action body
   * @param request Original request
   *
   * @returns DecodedPayload
   */
  // eslint-disable-next-line no-unused-vars
  abstract decode(
    decodedPayload: DecodedPayload<any>,
    payload: JSONObject,
    request: KuzzleRequest,
  ): Promise<DecodedPayload<any>>;

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
      action: this.action,
      deviceModel: this.deviceModel,
      measures: this.measures as NamedMeasures,
    };
  }
}

/* eslint-enable @typescript-eslint/no-unused-vars */
