import {
  Metadata,
  AssetContent,
  TemperatureMeasurement,
  PositionMeasurement,
  AssetModelDefinition,
} from "../../../index";

export interface ContainerMetadata extends Metadata {
  height: number;
  width: number;

  trailer: {
    weight: number;
    capacity: number;
  };
}

export type ContainerMeasurements = {
  temperatureExt: TemperatureMeasurement;
  temperatureInt: TemperatureMeasurement;
  position: PositionMeasurement;
  temperatureWeather: TemperatureMeasurement;
};

export interface ContainerAssetContent
  extends AssetContent<ContainerMeasurements, ContainerMetadata> {
  model: "Container";
}

export const containerAssetDefinition: AssetModelDefinition = {
  measures: [
    { name: "temperatureExt", type: "temperature" },
    { name: "temperatureInt", type: "temperature" },
    { name: "position", type: "position" },
    { name: "temperatureWeather", type: "temperature" },
  ],
  metadataMappings: {
    weight: { type: "integer" },
    height: { type: "integer" },
    trailer: {
      properties: {
        weight: { type: "integer" },
        capacity: { type: "integer" },
      },
    },
  },
  defaultMetadata: {
    height: 20,
  },
};

// This function is never called and only exists to make sure the types are correct
function neverCalled() {
  // @ts-ignore
  const container: ContainerAssetContent = {};

  container.metadata.height = 40;
  if (container.measures.temperatureExt) {
    container.measures.temperatureExt.values.temperature = 20;
  }
  if (container.measures.position) {
    container.measures.position.values.accuracy = 10;
  }
  // @ts-expect-error
  container.measures.unexistingMeasure;
  // @ts-expect-error
  container.measures.temperatureExt.values.notValue;
}
