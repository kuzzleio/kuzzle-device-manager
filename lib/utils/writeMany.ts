import { JSONObject } from "kuzzle";

export type mRequest = {
  _id: string;
  body: JSONObject;
}

export async function writeToDatabase (
  documents: mRequest[],
  writer: (documents: mRequest[]) => Promise<JSONObject>
) {
  const results = {
    errors: [],
    successes: [],
  }

  const limit = global.kuzzle.config.limits.documentsWriteCount;

  if (documents.length <= limit) {
    const { successes, errors } = await writer(documents);
    results.successes.push(...successes);
    results.errors.push(...errors);

    return results;
  }

  const writeMany = async (start: number, end: number) => {
    const devices = documents.slice(start, end);
    const { successes, errors } = await writer(devices);

    results.successes.push(successes);
    results.errors.push(errors);
  };

  let offset = 0;
  let offsetLimit = limit;
  let done = false;

  while (! done) {
    await writeMany(offset, offsetLimit)

    offset += limit;
    offsetLimit += limit;

    if (offsetLimit >= documents.length) {
      done = true;
      await writeMany(offset, documents.length);
    }
  }

  return results;
}