import groupBy from "lodash/groupBy";
import { NamedMeasures } from "../decoder";

function getNamedMeasuresDuplicates(measures: NamedMeasures): string[] {
  const duplicates: string[] = [];

  const groups = groupBy(measures, (elt) => elt.name);
  for (const group in groups) {
    if (groups[group].length > 1) {
      duplicates.push(group);
    }
  }

  return duplicates;
}

export { getNamedMeasuresDuplicates };
