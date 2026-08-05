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
    // Target model deliberately distinct from any of DummyTemp's native
    // measure names/types, so an adapted measure never collides with the
    // device's own raw "temperature"/"battery"/"multiSensor" measurements.
    name: "battery-as-humidity",
    measureModelSource: "battery",
    fieldMapping: [
      { measureModelTarget: "humidity", source: "battery", target: "humidity" },
    ],
  },
  {
    name: "temp-as-battery-invalid-scope",
    measureModelSource: "temperature",
    fieldMapping: [
      {
        measureModelTarget: "battery",
        source: "temperature",
        target: "battery",
      },
    ],
  },
  {
    name: "battery-as-envquality-humidity",
    measureModelSource: "battery",
    fieldMapping: [
      {
        measureModelTarget: "environmentalQuality",
        source: "battery",
        target: "envQuality.humidity",
      },
    ],
  },
  {
    // A single adapter fans out into two distinct target measures
    // (humidity + co2) from the same source slot.
    name: "multisensor-as-humidity-and-co2",
    measureModelSource: "multiSensorRaw",
    fieldMapping: [
      {
        measureModelTarget: "humidity",
        source: "readings.ch1",
        target: "humidity",
      },
      { measureModelTarget: "co2", source: "readings.ch2", target: "co2" },
    ],
  },
  {
    name: "multisensor-as-temp-invalid-field",
    measureModelSource: "multiSensorRaw",
    fieldMapping: [
      {
        measureModelTarget: "temperature",
        source: "readings.doesNotExist",
        target: "temperature",
      },
    ],
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
      model.measureModelSource,
      model.fieldMapping,
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
