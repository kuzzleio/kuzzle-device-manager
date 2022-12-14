import { RoleDefinition } from "kuzzle";

export interface KuzzleRole {
  name: string;

  definition: RoleDefinition;
}
