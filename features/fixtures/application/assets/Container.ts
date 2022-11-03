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

type ContainerMeasurements = TemperatureMeasurement["values"] &
  HumidityMeasurement["values"] &
  PositionMeasurement["values"];

interface ContainerAssetContent
  extends AssetContent<ContainerMeasurements, ContainerMetadata> {
  model: "container";
}

let container: ContainerAssetContent;

container.metadata.height = 40;
container?.measures[0]?.asset.metadata.height;
container.measures[0].asset.metadata;
