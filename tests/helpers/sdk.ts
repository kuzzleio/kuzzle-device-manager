import { Kuzzle, WebSocket } from "kuzzle-sdk";

export function useSdk(): Kuzzle {
  console.log("called sdk")
  return new Kuzzle(new WebSocket("localhost", { port: 7512 }));
}
