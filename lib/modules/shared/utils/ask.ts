export type AskEventDefinition = {
  name: string;

  payload: any;

  result: any;
};

export type AskEventHandler<
  TAskEventDefinition extends AskEventDefinition = AskEventDefinition,
> = (
  payload?: TAskEventDefinition["payload"],
) => Promise<TAskEventDefinition["result"]>;

export function onAsk<
  TAskEventDefinition extends AskEventDefinition = AskEventDefinition,
>(
  event: TAskEventDefinition["name"],
  handler: AskEventHandler<TAskEventDefinition>,
) {
  return global.kuzzle.onAsk(event, handler);
}

export async function ask<
  TAskEventDefinition extends AskEventDefinition = AskEventDefinition,
>(
  event: TAskEventDefinition["name"],
  payload?: TAskEventDefinition["payload"],
): Promise<TAskEventDefinition["result"]> {
  return global.kuzzle.ask(event, payload);
}
