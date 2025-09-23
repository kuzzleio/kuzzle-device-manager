import { BadRequestError, ControllerDefinition, KuzzleRequest } from "kuzzle";

import { DecodersRegister } from "./DecodersRegister";
import { PayloadService } from "./PayloadService";
import { ApiPayloadReceiveUnkownResult } from "./types/PayloadApi";

export class PayloadsController {
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
        receiveUnknown: {
          handler: this.receiveUnknown.bind(this),
          http: [
            {
              openapi: {
                description: `Receive a payload from a device`,
                parameters: [
                  {
                    in: "path",
                    name: "deviceModel",
                    required: true,
                    schema: {
                      type: "string",
                    },
                  },
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
              path: "device-manager/payload/:deviceModel",
              verb: "post",
            },
          ],
        },
        route: {
          handler: this.route.bind(this),
          http: [
            {
              openapi: {
                description: `Receive a payload from a device and reroute it to the corresponding endpoint`,
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
              path: "device-manager/payload/route",
              verb: "post",
            },
          ],
        },
      },
    };

    for (const decoder of this.decodersRegister.decoders) {
      this.definition.actions[decoder.action] = {
        handler: (request: KuzzleRequest) =>
          this.payloadService.receive(request, decoder),
        http: decoder.http,
      };
    }
  }

  async receiveUnknown(
    request: KuzzleRequest,
  ): Promise<ApiPayloadReceiveUnkownResult> {
    const payload = request.getBody();
    const deviceModel = request.getString("deviceModel", "unknownModel");
    const apiAction = `${request.input.controller}:${request.input.action}`;

    await this.payloadService.receiveUnknown(deviceModel, payload, apiAction);
  }

  async route(request: KuzzleRequest): Promise<{ valid: boolean }> {
    const payload = request.getBody();
    const model = payload.deviceModel;
    if (!model) {
      throw new BadRequestError(
        "Payload must specify the deviceModel for proper routing",
      );
    }
    const decoder = this.decodersRegister.decoders.find(
      (d) => d.deviceModel === model,
    );
    if (!decoder) {
      throw new BadRequestError("The specified device model is unknown");
    }
    app.log.debug("Routing payload to decoder for " + decoder.deviceModel);
    return this.payloadService.receive(request, decoder);
  }
}
