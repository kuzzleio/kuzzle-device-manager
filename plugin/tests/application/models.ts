import { DeviceManagerPlugin } from "../../index";
import { Container, Warehouse, MagicHouse, Room, StreetLamp } from "./assets";
import { Parking } from "./groups/Parking";
import { DummyTemp, DummyTempPosition, EmptyTemp } from "./devices";
import {
  Acceleration,
  Brightness,
  CO2,
  Illuminance,
  Magicule,
  PowerConsumption,
  temperatureMeasureModel,
  batteryMeasureModel,
  positionMeasureModel,
  movementMeasureModel,
  humidityMeasureModel,
} from "./measures";
import { AssetRestricted, DeviceRestricted } from "./groups";

const measuresModels = [
  Acceleration,
  Brightness,
  CO2,
  Illuminance,
  Magicule,
  PowerConsumption,
  temperatureMeasureModel,
  batteryMeasureModel,
  positionMeasureModel,
  movementMeasureModel,
  humidityMeasureModel,
];

const devicesModels = [DummyTemp, DummyTempPosition, EmptyTemp];

const assetsModels = {
  // Register assets for the "commons" group
  commons: [Container, Warehouse, MagicHouse],

  // Register assets for specialized groups
  air_quality: [Room],
  public_lighting: [StreetLamp],
};
const groupModels = {
  air_quality: [Parking, AssetRestricted, DeviceRestricted],
};

export const measureAdapterModels = [
  {
    name: "battery-as-temp",
    sourceField: "battery",
    sourceType: "battery",
    targetField: "temperature",
    targetMeasureName: "temp",
    targetType: "temperature",
  },
  // Intentionally backwards (asset-scope source -> device-scope target), used to test
  // that setMeasureAdapter rejects adapters violating the device->asset scope direction.
  {
    name: "temp-as-battery-invalid-scope",
    sourceField: "temperature",
    sourceType: "temperature",
    targetField: "battery",
    targetMeasureName: "batteryCopy",
    targetType: "battery",
  },
];

export function registerModels(deviceManager: DeviceManagerPlugin) {
  for (const model of measuresModels) {
    deviceManager.models.registerMeasure(model.modelName, model.definition);
  }

  for (const model of devicesModels) {
    deviceManager.models.registerDevice(model.modelName, model.definition);
  }

  for (const model of measureAdapterModels) {
    deviceManager.models.registerMeasureAdapter(
      model.name,
      model.sourceType,
      model.sourceField,
      model.targetMeasureName,
      model.targetType,
      model.targetField,
    );
  }

  for (const [engine, models] of Object.entries(assetsModels)) {
    for (const model of models) {
      deviceManager.models.registerAsset(
        [engine],
        model.modelName,
        model.definition,
      );
    }
  }
  for (const [engine, models] of Object.entries(groupModels)) {
    for (const model of models) {
      deviceManager.models.registerGroup(
        [engine],
        model.modelName,
        model.definition,
      );
    }
  }
}
