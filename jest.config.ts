import type { Config } from "@jest/types";

// Sync object
const config: Config.InitialOptions = {
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "./tests/tsconfig.json" }],
  },
  verbose: true,
};
export default config;
