import { Mutex } from "kuzzle";

export async function lock<TReturn>(
  lockId: string,
  cb: () => Promise<TReturn>,
) {
  const mutex = new Mutex(lockId);

  try {
    await mutex.lock();

    return await cb();
  } finally {
    await mutex.unlock();
  }
}
