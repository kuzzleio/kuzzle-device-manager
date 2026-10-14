import { Mutex } from "kuzzle";

export async function lock<TReturn>(
  lockId: string,
  cb: () => Promise<TReturn>,
  {
    ttl,
  }: {
    /**
     * Lock TTL in milliseconds, the lock is released after it even if cb is still running
     * (Kuzzle default: 5000)
     */
    ttl?: number;
  } = {},
) {
  const mutex = new Mutex(lockId, ttl === undefined ? {} : { ttl });

  try {
    await mutex.lock();

    return await cb();
  } finally {
    await mutex.unlock();
  }
}
