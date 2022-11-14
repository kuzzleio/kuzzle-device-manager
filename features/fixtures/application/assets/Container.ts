import {
  Metadata,
  AssetContent,
  HumidityMeasurement,
  TemperatureMeasurement,
  PositionMeasurement,
} from "../../../../index";

interface ContainerMetadata extends Metadata {
  height: number;
  width: number;

  trailer: {
    weight: number;
    capacity: number;
  };
}

// @todo fix this
type ContainerMeasurements = TemperatureMeasurement["values"] &
  HumidityMeasurement["values"] &
  PositionMeasurement["values"];

interface ContainerAssetContent
  extends AssetContent<ContainerMeasurements, ContainerMetadata> {
  model: "container";
}

// This function is never called and only exists to make sure the types are correct
function neverCalled() {
  let container: ContainerAssetContent;

  container.metadata.height = 40;
  container?.measures[0]?.asset.metadata.height;
  container.measures[0].asset.metadata;
}
