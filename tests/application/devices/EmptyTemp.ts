import { DeviceModel } from "../../../index";
import { EmptyTempDecoder } from "../decoders/EmptyTempDecoder";

export const EmptyTemp: DeviceModel = {
  modelName: "EmptyTemp",
  definition: {
    decoder: new EmptyTempDecoder(),
    metadataMappings: {
      color: { type: "keyword" },
    },
  },
};
