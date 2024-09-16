import { DigitalTwinMeasures } from "./DigitalTwinMeasures";

interface DigitalTwinControllerRequest<ControllerName extends string> {
  controller: ControllerName;

  engineId: string;
}

export interface ApiDigitalTwinGetLastMeasuresRequest<
  ControllerName extends string,
> extends DigitalTwinControllerRequest<ControllerName> {
  action: "getLastMeasures";

  _id: string;
  measureCount?: number;
}
export type ApiDigitalTwinGetLastMeasuresResult = DigitalTwinMeasures;

export interface ApiDigitalTwinMGetLastMeasuresRequest<
  ControllerName extends string,
> extends DigitalTwinControllerRequest<ControllerName> {
  action: "mGetLastMeasures";

  measureCount?: number;

  body: {
    ids: string[];
  };
}
export type ApiDigitalTwinMGetLastMeasuresResult = Record<
  string,
  DigitalTwinMeasures
>;

export interface ApiDigitalTwinGetLastMeasuredAtRequest<
  ControllerName extends string,
> extends DigitalTwinControllerRequest<ControllerName> {
  action: "getLastMeasuredAt";

  _id: string;
}
export type ApiDigitalTwinGetLastMeasuredAtResult = {
  lastMeasuredAt: number;
};

export interface ApiDigitalTwinMGetLastMeasuredAtRequest<
  ControllerName extends string,
> extends DigitalTwinControllerRequest<ControllerName> {
  action: "mGetLastMeasuredAt";

  body: {
    ids: string[];
  };
}
export type ApiDigitalTwinMGetLastMeasuredAtResult = Record<string, number>;
