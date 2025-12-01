import { writable } from 'svelte/store';

export interface CachedResponse {
  status: number;
  statusText: string;
  headers: { key: string; value: string }[];
  body: string;
  time: number;
  size: number;
}

interface ResponseCache {
  [requestId: string]: CachedResponse;
}

function createResponseStore() {
  const { subscribe, set, update } = writable<ResponseCache>({});

  return {
    subscribe,
    setResponse: (requestId: string, response: CachedResponse) => {
      update((cache) => ({
        ...cache,
        [requestId]: response,
      }));
    },
    getResponse: (requestId: string): CachedResponse | undefined => {
      let result: CachedResponse | undefined;
      subscribe((cache) => {
        result = cache[requestId];
      })();
      return result;
    },
    clearResponse: (requestId: string) => {
      update((cache) => {
        const newCache = { ...cache };
        delete newCache[requestId];
        return newCache;
      });
    },
    clearAll: () => {
      set({});
    },
  };
}

export const responseStore = createResponseStore();
