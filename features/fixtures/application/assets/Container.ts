import {
  Metadata,
  AssetContent,
  TemperatureMeasurement,
  PositionMeasurement,
  EmbeddedMeasure,
} from "../../../../index";

interface ContainerMetadata extends Metadata {
  height: number;
  width: number;

  trailer: {
    weight: number;
    capacity: number;
  };
}

type ContainerMeasurements = {
  temperatureExt: TemperatureMeasurement;
  position: PositionMeasurement;
};

interface ContainerAssetContent
  extends AssetContent<ContainerMeasurements, ContainerMetadata> {
  model: "Container";
}

// This function is never called and only exists to make sure the types are correct
function neverCalled() {
  let container: ContainerAssetContent;

  container.metadata.height = 40;
  container.measures.temperatureExt.values.temperature = 20;
  container.measures.position.values.accuracy = 10;
  // @ts-expect-error
  container.measures.unexistingMeasure;
  // @ts-expect-error
  container.measures.temperatureExt.values.notValue;
}
