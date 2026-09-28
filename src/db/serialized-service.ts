import type { IOzipzDatabaseService } from "./types";

export async function withBrowserStorageLock<T>(operation: () => T | Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && typeof navigator.locks?.request === "function") {
    return navigator.locks.request("ozipz-browser-storage", operation);
  }
  return operation();
}

/** Keep each complete repository operation together, including BEGIN through COMMIT/ROLLBACK. */
export function serializeDatabaseService(service: IOzipzDatabaseService, lockBrowserStorage = false): IOzipzDatabaseService {
  let tail: Promise<unknown> = Promise.resolve();
  return new Proxy(service, {
    get(target, property) {
      const value = Reflect.get(target, property);
      if (typeof value !== "function") return value;
      return (...args: unknown[]) => {
        const run = () => value.apply(target, args);
        const result = tail.then(() => lockBrowserStorage ? withBrowserStorageLock(run) : run());
        tail = result.catch(() => {});
        return result;
      };
    },
  });
}
