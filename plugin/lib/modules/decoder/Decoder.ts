import { HttpRoute, KuzzleRequest, PreconditionError } from "kuzzle";
import _ from "lodash";
import { JSONObject } from "kuzzle-sdk";
import { KuzzleLogger } from "kuzzle-logger";
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
 * Array of action slot declarations
 *
 * Used to declare which actions a device codec can encode (outbound commands).
 */
export type NamedActions = Array<{
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
  public log: KuzzleLogger;
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
   * Declaration of the actions this codec can encode (outbound commands).
   * Action types should be registered as action models on the plugin.
   *
   * @example
   *
   * this.actions = [
   *   { type: 'temperatureSetpoint', name: 'setTemperature' },
   * ];
   */
  public actions: ReadonlyArray<NamedActions[0]> = [];

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
   * Encode an action request into a device-specific payload.
   * Override this method in codecs that support outbound commands.
   *
   * @param actionName Name of the action slot on the device
   * @param args Action arguments (validated against the action model's schema)
   *
   * @returns Device-specific payload to send
   */
  // eslint-disable-next-line no-unused-vars
  async encode(actionName: string, args: JSONObject): Promise<JSONObject> {
    throw new PreconditionError(
      `Encoder not implemented for device model "${this.deviceModel}"`,
    );
  }

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

  get actionNames(): string[] {
    return this.actions.map(({ name }) => name);
  }

  get actionTypes(): string[] {
    return this.actions.map(({ type }) => type);
  }

  serialize(): DecoderContent {
    return {
      action: this.action,
      deviceModel: this.deviceModel,
      measures: this.measures as NamedMeasures,
      actions: this.actions as NamedActions,
    };
  }
}

/* eslint-enable @typescript-eslint/no-unused-vars */
