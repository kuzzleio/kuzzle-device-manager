import { KuzzleRequest } from "kuzzle";
import { DeviceProvisioningContent } from "../../device";

/**
 *
 */
export type EventPayloadDeviceProvisioning = {
  name: "device-manager:payload:provision-device:before";

  args: [
    {
      device: DeviceProvisioningContent;
      request: KuzzleRequest;
    },
  ];
};
