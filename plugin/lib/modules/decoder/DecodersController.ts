import { BadRequestError, ControllerDefinition, KuzzleRequest } from "kuzzle";

import { DecodersRegister } from "./DecodersRegister";
import { PayloadService } from "./PayloadService";
import {
  ApiDecoderListResult,
  ApiDecoderPrunePayloadsResult,
} from "./types/DecoderApi";

export class DecodersController {
  private payloadService: PayloadService;
  private decodersRegister: DecodersRegister;

  public definition: ControllerDefinition;

  constructor(
    payloadService: PayloadService,
    decodersRegister: DecodersRegister,
  ) {
    this.payloadService = payloadService;
    this.decodersRegister = decodersRegister;

    this.definition = {
      actions: {
        list: {
          handler: this.list.bind(this),
          http: [{ path: "device-manager/decoders", verb: "get" }],
        },
        prunePayloads: {
          handler: this.prunePayloads.bind(this),
          http: [
            { path: "device-manager/decoders/_prunePayloads", verb: "delete" },
          ],
        },
        route: {
          handler: this.route.bind(this),
          http: [
            {
              path: "device-manager/decoders/route",
              verb: "post",
            },
          ],
        },
      },
    };
  }

  /**
   * List all available decoders
   */
  async list(): Promise<ApiDecoderListResult> {
    const decoders = this.decodersRegister.list();

    return { decoders };
  }

  /**
   * Clean payload collection for a time period
   */
  async prunePayloads(
    request: KuzzleRequest,
  ): Promise<ApiDecoderPrunePayloadsResult> {
    const days = request.getBodyNumber("days");
    const deviceModel = request.input.body.deviceModel;
    const onlyValid = request.input.body.onlyValid ?? true;

    const deleted = await this.payloadService.prune(days, onlyValid, {
      deviceModel,
    });

    return { deleted };
  }

  /**
   * Route request to appropriate decoder
   */
  async route(request: KuzzleRequest): Promise<{ valid: boolean }> {
    const payload = request.getBody();
    const model =
      payload.deviceModel ?? request.getString("deviceModel", "unknownModel");
    const apiAction = `${request.input.controller}:${request.input.action}`;
    if (model === "unknownModel") {
      app.log.warn(
        "Received payload without a device model: routing to receiveUnknown",
      );
      this.payloadService.receiveUnknown(model, payload, apiAction);
      throw new BadRequestError(
        "Payload must specify the deviceModel for proper routing",
      );
    }
    const decoder = this.decodersRegister.decoders.find(
      (d) => d.deviceModel === model,
    );
    if (!decoder) {
      app.log.warn(
        `Received payload from ${model} model, no associated decoder found: routing to receiveUnknown`,
      );
      this.payloadService.receiveUnknown(model, payload, apiAction);
      throw new BadRequestError("The specified device model is unknown");
    }
    app.log.debug("Routing payload to decoder for " + decoder.deviceModel);
    return this.payloadService.receive(request, decoder);
  }
}
