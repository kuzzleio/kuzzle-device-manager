import { ControllerDefinition, KuzzleRequest } from "kuzzle";

import { DecodersRegister } from "./DecodersRegister";
import { PayloadService } from "./PayloadService";
import {
  ApiPayloadGetResult,
  ApiPayloadReceiveUnkownResult,
} from "./types/PayloadApi";

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
        get: {
          handler: this.get.bind(this),
          http: [{ path: "device-manager/payload/:_id", verb: "get" }],
        },
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

  async get(request: KuzzleRequest): Promise<ApiPayloadGetResult> {
    const payloadUuid = request.getString("_id", "");

    return this.payloadService.get(payloadUuid);
  }

  async receiveUnknown(
    request: KuzzleRequest,
  ): Promise<ApiPayloadReceiveUnkownResult> {
    const payload = request.getBody();
    const deviceModel = request.getString("deviceModel", "unknownModel");
    const apiAction = `${request.input.controller}:${request.input.action}`;

    await this.payloadService.receiveUnknown(deviceModel, payload, apiAction);
  }
}
