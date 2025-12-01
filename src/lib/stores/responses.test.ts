import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { responseStore } from './responses';

describe('Response Store', () => {
  beforeEach(() => {
    // Clear all responses to reset state
    responseStore.clearAll();
  });

  describe('Initial State', () => {
    it('should initialize with empty responses map', () => {
      const state = get(responseStore);
      expect(state).toEqual({});
    });
  });

  describe('setResponse', () => {
    it('should store a response for a request ID', () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: [{ key: 'content-type', value: 'application/json' }],
        body: '{"message": "success"}',
        time: 150,
        size: 100,
      };

      responseStore.setResponse('request-1', mockResponse);
      const state = get(responseStore);

      expect(state['request-1']).toEqual(mockResponse);
    });

    it('should store multiple responses with different request IDs', () => {
      const response1 = {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'response 1',
        time: 100,
        size: 50,
      };

      const response2 = {
        status: 404,
        statusText: 'Not Found',
        headers: [],
        body: 'response 2',
        time: 50,
        size: 30,
      };

      responseStore.setResponse('request-1', response1);
      responseStore.setResponse('request-2', response2);

      const state = get(responseStore);
      expect(state['request-1']).toEqual(response1);
      expect(state['request-2']).toEqual(response2);
    });

    it('should overwrite existing response for the same request ID', () => {
      const originalResponse = {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'original',
        time: 100,
        size: 50,
      };

      const updatedResponse = {
        status: 201,
        statusText: 'Created',
        headers: [{ key: 'x-custom', value: 'header' }],
        body: 'updated',
        time: 200,
        size: 60,
      };

      responseStore.setResponse('request-1', originalResponse);
      responseStore.setResponse('request-1', updatedResponse);

      const state = get(responseStore);
      expect(state['request-1']).toEqual(updatedResponse);
    });

    it('should handle complex response objects', () => {
      const complexResponse = {
        status: 200,
        statusText: 'OK',
        headers: [
          { key: 'content-type', value: 'application/json' },
          { key: 'x-custom-header', value: 'value' },
          { key: 'set-cookie', value: 'session=abc123' },
        ],
        body: JSON.stringify({
          data: [1, 2, 3],
          meta: { total: 3 },
        }),
        time: 250,
        size: 100,
      };

      responseStore.setResponse('request-complex', complexResponse);
      const state = get(responseStore);

      expect(state['request-complex']).toEqual(complexResponse);
    });
  });

  describe('getResponse', () => {
    it('should retrieve stored response by request ID', () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'test',
        time: 100,
        size: 50,
      };

      responseStore.setResponse('request-1', mockResponse);
      const retrieved = responseStore.getResponse('request-1');

      expect(retrieved).toEqual(mockResponse);
    });

    it('should return undefined for non-existent request ID', () => {
      const retrieved = responseStore.getResponse('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should return correct response when multiple responses exist', () => {
      const response1 = {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'response 1',
        time: 100,
        size: 50,
      };

      const response2 = {
        status: 201,
        statusText: 'Created',
        headers: [],
        body: 'response 2',
        time: 150,
        size: 60,
      };

      responseStore.setResponse('request-1', response1);
      responseStore.setResponse('request-2', response2);

      expect(responseStore.getResponse('request-1')).toEqual(response1);
      expect(responseStore.getResponse('request-2')).toEqual(response2);
    });

    it('should retrieve updated response after overwrite', () => {
      const originalResponse = {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'original',
        time: 100,
        size: 50,
      };

      const updatedResponse = {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'updated',
        time: 120,
        size: 55,
      };

      responseStore.setResponse('request-1', originalResponse);
      responseStore.setResponse('request-1', updatedResponse);

      expect(responseStore.getResponse('request-1')).toEqual(updatedResponse);
    });
  });

  describe('clearResponse', () => {
    it('should remove a specific response by request ID', () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'test',
        time: 100,
        size: 50,
      };

      responseStore.setResponse('request-1', mockResponse);
      responseStore.clearResponse('request-1');

      const state = get(responseStore);
      expect(state['request-1']).toBeUndefined();
    });

    it('should only remove the specified response', () => {
      const response1 = {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'response 1',
        time: 100,
        size: 50,
      };

      const response2 = {
        status: 201,
        statusText: 'Created',
        headers: [],
        body: 'response 2',
        time: 150,
        size: 60,
      };

      responseStore.setResponse('request-1', response1);
      responseStore.setResponse('request-2', response2);

      responseStore.clearResponse('request-1');

      const state = get(responseStore);
      expect(state['request-1']).toBeUndefined();
      expect(state['request-2']).toEqual(response2);
    });

    it('should handle clearing non-existent response gracefully', () => {
      responseStore.setResponse('request-1', {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'test',
        time: 100,
        size: 50,
      });

      responseStore.clearResponse('non-existent');

      const state = get(responseStore);
      expect(state['request-1']).toBeDefined();
    });

    it('should allow re-adding response after clearing', () => {
      const originalResponse = {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'original',
        time: 100,
        size: 50,
      };

      const newResponse = {
        status: 201,
        statusText: 'Created',
        headers: [],
        body: 'new',
        time: 150,
        size: 60,
      };

      responseStore.setResponse('request-1', originalResponse);
      responseStore.clearResponse('request-1');
      responseStore.setResponse('request-1', newResponse);

      expect(responseStore.getResponse('request-1')).toEqual(newResponse);
    });
  });

  describe('clearAll', () => {
    it('should remove all responses', () => {
      responseStore.setResponse('request-1', {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'response 1',
        time: 100,
        size: 50,
      });

      responseStore.setResponse('request-2', {
        status: 201,
        statusText: 'Created',
        headers: [],
        body: 'response 2',
        time: 150,
        size: 60,
      });

      responseStore.setResponse('request-3', {
        status: 404,
        statusText: 'Not Found',
        headers: [],
        body: 'response 3',
        time: 80,
        size: 40,
      });

      responseStore.clearAll();

      const state = get(responseStore);
      expect(state).toEqual({});
    });

    it('should reset store to initial state', () => {
      responseStore.setResponse('request-1', {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'test',
        time: 100,
        size: 50,
      });

      responseStore.clearAll();

      const state = get(responseStore);
      expect(Object.keys(state)).toHaveLength(0);
    });

    it('should allow adding responses after clearing all', () => {
      responseStore.setResponse('request-1', {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'original',
        time: 100,
        size: 50,
      });

      responseStore.clearAll();

      const newResponse = {
        status: 201,
        statusText: 'Created',
        headers: [],
        body: 'new',
        time: 150,
        size: 60,
      };

      responseStore.setResponse('request-2', newResponse);

      const state = get(responseStore);
      expect(state['request-1']).toBeUndefined();
      expect(state['request-2']).toEqual(newResponse);
    });

    it('should handle calling clearAll on empty store', () => {
      responseStore.clearAll();
      responseStore.clearAll(); // Call again

      const state = get(responseStore);
      expect(state).toEqual({});
    });
  });

  describe('Store Subscription', () => {
    it('should notify subscribers when a response is set', () => {
      const states: Record<string, unknown>[] = [];
      const unsubscribe = responseStore.subscribe((state) => {
        states.push({ ...state });
      });

      responseStore.setResponse('request-1', {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'test',
        time: 100,
        size: 50,
      });

      expect(states.length).toBeGreaterThan(1);
      expect(states.at(-1)!['request-1']).toBeDefined();

      unsubscribe();
    });

    it('should notify subscribers when a response is cleared', () => {
      responseStore.setResponse('request-1', {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'test',
        time: 100,
        size: 50,
      });

      const states: Record<string, unknown>[] = [];
      const unsubscribe = responseStore.subscribe((state) => {
        states.push({ ...state });
      });

      responseStore.clearResponse('request-1');

      expect(states.length).toBeGreaterThan(1);
      expect(states.at(-1)!['request-1']).toBeUndefined();

      unsubscribe();
    });

    it('should notify subscribers when all responses are cleared', () => {
      responseStore.setResponse('request-1', {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'test',
        time: 100,
        size: 50,
      });

      const states: Record<string, unknown>[] = [];
      const unsubscribe = responseStore.subscribe((state) => {
        states.push({ ...state });
      });

      responseStore.clearAll();

      expect(states.length).toBeGreaterThan(1);
      expect(Object.keys(states.at(-1)!)).toHaveLength(0);

      unsubscribe();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle rapid set and get operations', () => {
      const responses = Array.from({ length: 10 }, (_, i) => ({
        id: `request-${i}`,
        data: {
          status: 200,
          statusText: 'OK',
          headers: [],
          body: `response ${i}`,
          time: i * 10,
          size: 50,
        },
      }));

      responses.forEach((r) => responseStore.setResponse(r.id, r.data));

      responses.forEach((r) => {
        expect(responseStore.getResponse(r.id)).toEqual(r.data);
      });
    });

    it('should handle mixed operations correctly', () => {
      responseStore.setResponse('request-1', {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'response 1',
        time: 100,
        size: 50,
      });

      responseStore.setResponse('request-2', {
        status: 201,
        statusText: 'Created',
        headers: [],
        body: 'response 2',
        time: 150,
        size: 60,
      });

      responseStore.clearResponse('request-1');

      responseStore.setResponse('request-3', {
        status: 404,
        statusText: 'Not Found',
        headers: [],
        body: 'response 3',
        time: 80,
        size: 40,
      });

      const state = get(responseStore);
      expect(state['request-1']).toBeUndefined();
      expect(state['request-2']).toBeDefined();
      expect(state['request-3']).toBeDefined();
      expect(Object.keys(state)).toHaveLength(2);
    });

    it('should maintain independence between different request IDs', () => {
      const response1 = {
        status: 200,
        statusText: 'OK',
        headers: [],
        body: 'response 1',
        time: 100,
        size: 100,
      };

      const response2 = {
        status: 500,
        statusText: 'Server Error',
        headers: [],
        body: 'error',
        time: 50,
        size: 50,
      };

      responseStore.setResponse('request-1', response1);
      responseStore.setResponse('request-2', response2);

      const retrieved1 = responseStore.getResponse('request-1');
      const retrieved2 = responseStore.getResponse('request-2');

      expect(retrieved1?.body).toBe('response 1');
      expect(retrieved2?.body).toBe('error');
      expect(retrieved1?.status).toBe(200);
      expect(retrieved2?.status).toBe(500);
    });
  });
});
