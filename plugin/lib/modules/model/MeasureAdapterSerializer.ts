import { Inflector } from "kuzzle";

import { MeasureAdapterContent } from "./types/MeasureAdapterContent";

export class MeasureAdapterSerializer {
  static id(name: string): string {
    return `measureAdapter--${Inflector.kebabCase(name)}`;
  }

  static document(content: MeasureAdapterContent) {
    return {
      measureAdapter: content,
      type: "measureAdapter",
    };
  }
}
