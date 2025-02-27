import { Backend } from "kuzzle";

import {
  MeasureContent,
  EventMeasureProcessSourceBefore,
  EventMeasurePersistSourceBefore,
  TemperatureMeasurement,
} from "../../../index";

function handleTestPersistBefore(
  source: any,
  measures: MeasureContent[],
): void {
  if (source.metadata?.color !== "test-persist-before-event-temperature-42") {
    return;
  }

  const temperatureExt = measures.find(
    (m) => m.asset?.measureName === "temperatureExt",
  );
  if (!temperatureExt || temperatureExt.values.temperature !== 42) {
    throw new Error(
      "The updated temperatureExt measure was not found in the measures array",
    );
  }
}

function enrichTemperatureMeasures(measures: MeasureContent[]): void {
  for (const measure of measures) {
    if (measure.values.temperature) {
      measure.values.temperature *= 2;
    }
  }
}

// Helper: Compute and return new temperature measures.
function computeTemperatureIntMeasures(
  measures: MeasureContent[],
  asset: any,
): MeasureContent[] {
  return measures.reduce((computed: MeasureContent[], measure) => {
    if (measure.type === "temperature") {
      const computedMeasure: MeasureContent = {
        asset: {
          _id: measure.asset?._id ?? "",
          groups: measure.asset?.groups ?? [],
          measureName: "temperatureInt",
          metadata: measure.asset?.metadata ?? {},
          model: measure.asset?.model ?? "",
          reference: measure.asset?.reference ? asset.reference : "",
          softTenant:
            measure.asset?.softTenant && measure.asset.softTenant.length
              ? measure.asset.softTenant
              : [],
        },
        measuredAt: measure.measuredAt,
        origin: {
          type: "computed",
          _id: "compute-temperature-int",
          measureName: "temperatureInt",
          payloadUuids: measure.origin.payloadUuids,
        },
        type: "temperature",
        values: {
          temperature: measure.values.temperature * 2,
        },
      };
      computed.push(computedMeasure);
    }
    return computed;
  }, []);
}

function addTemperatureWeatherMeasure(
  asset: any,
  measures: MeasureContent[],
): void {
  const newMeasure: MeasureContent<TemperatureMeasurement> = {
    measuredAt: Date.now(),
    asset: {
      _id: asset ? `${asset.model}-${asset.reference}` : "",
      groups: asset ? asset.groups : [],
      measureName: "temperatureWeather",
      metadata: asset ? asset.metadata : {},
      model: asset ? asset.model : "",
      reference: asset ? asset.reference : "",
      softTenant: asset ? asset.softTenant : [],
    },
    origin: {
      type: "computed",
      _id: "rule-weather-api",
      measureName: "temperatureWeather",
      payloadUuids: ["uuid"],
    },
    type: "temperature",
    values: {
      temperature: 21.21,
    },
  };
  measures.push(newMeasure);
}

export function registerTestPipes(app: Backend) {
  app.pipe.register<EventMeasurePersistSourceBefore>(
    "device-manager:measures:persist:sourceBefore",
    async ({ source, target, asset, measures }) => {
      handleTestPersistBefore(source, measures);
      return { source, target, asset, measures };
    },
  );

  app.pipe.register<EventMeasureProcessSourceBefore>(
    "device-manager:measures:process:sourceBefore",
    async ({ source, target, asset, measures }) => {
      if (source.id === "DummyTemp-enrich_me_master") {
        enrichTemperatureMeasures(measures);
      }

      if (source.id === "DummyTemp-compute_me_master") {
        const computedMeasures = computeTemperatureIntMeasures(measures, asset);
        measures.push(...computedMeasures);
      }

      if (source.metadata?.color === "test-create-new-asset-measure") {
        addTemperatureWeatherMeasure(asset, measures);
      }

      return { source, target, asset, measures };
    },
  );
}
