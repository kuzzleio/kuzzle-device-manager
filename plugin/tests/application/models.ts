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
  environmentalQualityMeasureModel,
  multiSensorRawMeasureModel,
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
  environmentalQualityMeasureModel,
  multiSensorRawMeasureModel,
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
    sourceType: "battery",
    targetField: "temperature",
    targetMeasureName: "temp",
    targetType: "temperature",
  },
  {
    name: "temp-as-battery-invalid-scope",
    sourceType: "temperature",
    targetField: "battery",
    targetMeasureName: "batteryCopy",
    targetType: "battery",
  },
  {
    name: "battery-as-envquality-humidity",
    sourceType: "battery",
    targetField: "envQuality.humidity",
    targetMeasureName: "envQualityFromBattery",
    targetType: "environmentalQuality",
  },
  {
    name: "multisensor-as-temp",
    sourceType: "multiSensorRaw",
    targetField: "temperature",
    targetMeasureName: "tempFromMultiSensor",
    targetType: "temperature",
  },
  {
    name: "multisensor-as-envquality-co2",
    sourceType: "multiSensorRaw",
    targetField: "envQuality.co2",
    targetMeasureName: "co2FromMultiSensor",
    targetType: "environmentalQuality",
  },
  {
    name: "multisensor-as-temp-conflict",
    sourceType: "multiSensorRaw",
    targetField: "temperature",
    targetMeasureName: "temp",
    targetType: "temperature",
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
