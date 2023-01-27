import { Kuzzle, WebSocket } from "kuzzle-sdk";

export function getSdk(): Kuzzle {
  return new Kuzzle(new WebSocket("localhost", { port: 7512 }));
}
