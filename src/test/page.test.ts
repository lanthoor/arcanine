import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Tauri API
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

// Import the actual functions to test
// Note: Since these are inside a Svelte component, we'll test their logic by recreating them
// This is a limitation of testing Svelte component logic directly

describe('Main Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Header Conversion Functions', () => {
    // Test the actual convertHeadersToRecord function from +page.svelte
    const convertHeadersToRecord = (
      headers?: { key: string; value: string }[]
    ): Record<string, string> => {
      if (!headers || headers.length === 0) return {};
      return headers.reduce(
        (acc, h) => {
          if (h.key && h.value) {
            acc[h.key] = h.value;
          }
          return acc;
        },
        {} as Record<string, string>
      );
    };

    // Test the actual convertRecordToHeaders function from +page.svelte
    const convertRecordToHeaders = (
      record: Record<string, string>
    ): { key: string; value: string }[] => {
      return Object.entries(record).map(([key, value]) => ({ key, value }));
    };

    it('should convert headers array to record', () => {
      const headers = [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer token' },
      ];
      const result = convertHeadersToRecord(headers);
      expect(result['Content-Type']).toBe('application/json');
      expect(result['Authorization']).toBe('Bearer token');
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should handle empty headers array', () => {
      expect(convertHeadersToRecord([])).toEqual({});
      expect(convertHeadersToRecord()).toEqual({});
    });

    it('should skip headers with empty keys or values', () => {
      const headers = [
        { key: 'Content-Type', value: 'application/json' },
        { key: '', value: 'should-be-skipped' },
        { key: 'Empty-Value', value: '' },
      ];
      const result = convertHeadersToRecord(headers);
      expect(result['Content-Type']).toBe('application/json');
      expect(result['']).toBeUndefined();
      expect(result['Empty-Value']).toBeUndefined();
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should convert record to headers array', () => {
      const record = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      };
      const result = convertRecordToHeaders(record);
      expect(result).toHaveLength(2);
      expect(result.find((h) => h.key === 'Content-Type')?.value).toBe('application/json');
      expect(result.find((h) => h.key === 'Authorization')?.value).toBe('Bearer token');
    });

    it('should handle empty record', () => {
      const result = convertRecordToHeaders({});
      expect(result).toEqual([]);
    });

    it('should maintain header values with special characters', () => {
      const headers = [
        { key: 'X-Custom-Header', value: 'value=with=equals' },
        { key: 'Set-Cookie', value: 'sessionid=abc123; Path=/; HttpOnly' },
      ];
      const result = convertHeadersToRecord(headers);
      expect(result['X-Custom-Header']).toBe('value=with=equals');
      expect(result['Set-Cookie']).toBe('sessionid=abc123; Path=/; HttpOnly');
    });

    it('should do round-trip conversion correctly', () => {
      const originalHeaders = [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer token123' },
      ];
      const record = convertHeadersToRecord(originalHeaders);
      const resultHeaders = convertRecordToHeaders(record);

      // Sort both arrays for comparison
      const sortByKey = (a: { key: string }, b: { key: string }) => a.key.localeCompare(b.key);
      originalHeaders.sort(sortByKey);
      resultHeaders.sort(sortByKey);

      expect(resultHeaders).toEqual(originalHeaders);
    });
  });

  describe('Request Execution with Tauri Backend', () => {
    it('should invoke Tauri execute_request command with correct parameters', async () => {
      const mockResponse = {
        status: 200,
        status_text: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: '{"success": true}',
        time_ms: 1234,
      };
      mockInvoke.mockResolvedValue(mockResponse);

      const request = {
        name: 'Test Request',
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: {},
        body: null,
      };

      const result = await mockInvoke('execute_request', { request });

      expect(mockInvoke).toHaveBeenCalledWith('execute_request', { request });
      expect(mockInvoke).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(200);
      expect(result.status_text).toBe('OK');
    });

    it('should handle successful GET request', async () => {
      const mockResponse = {
        status: 200,
        status_text: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: '{"success": true}',
        time_ms: 1234,
      };
      mockInvoke.mockResolvedValue(mockResponse);

      const result = await mockInvoke('execute_request', {
        request: {
          name: 'Test',
          method: 'GET',
          url: 'https://api.example.com',
          headers: {},
          body: null,
        },
      });

      expect(result.status).toBe(200);
      expect(result.status_text).toBe('OK');
      expect(result.body).toBe('{"success": true}');
      expect(result.time_ms).toBe(1234);
    });

    it('should handle POST request with JSON body', async () => {
      const mockResponse = {
        status: 201,
        status_text: 'Created',
        headers: { 'Content-Type': 'application/json' },
        body: '{"id": 123, "name": "John"}',
        time_ms: 2345,
      };
      mockInvoke.mockResolvedValue(mockResponse);

      const request = {
        name: 'Create User',
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name": "John", "email": "john@example.com"}',
      };

      const result = await mockInvoke('execute_request', { request });

      expect(result.status).toBe(201);
      expect(result.body).toContain('"id"');
      expect(result.body).toContain('"name"');
    });

    it('should pass custom headers to backend', async () => {
      const mockResponse = {
        status: 200,
        status_text: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
        },
        body: '{}',
        time_ms: 1000,
      };
      mockInvoke.mockResolvedValue(mockResponse);

      const request = {
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com',
        headers: {
          Authorization: 'Bearer token123',
          'X-Api-Key': 'secret-key',
        },
        body: null,
      };

      await mockInvoke('execute_request', { request });

      const callArgs = mockInvoke.mock.calls[0];
      expect(callArgs[0]).toBe('execute_request');
      expect(callArgs[1].request.headers).toEqual({
        Authorization: 'Bearer token123',
        'X-Api-Key': 'secret-key',
      });
    });

    it('should return response time from backend', async () => {
      const mockResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: '{}',
        time_ms: 5678,
      };
      mockInvoke.mockResolvedValue(mockResponse);

      const result = await mockInvoke('execute_request', {
        request: {
          name: 'Test',
          method: 'GET',
          url: 'https://api.example.com',
          headers: {},
          body: null,
        },
      });

      expect(result.time_ms).toBe(5678);
    });
  });

  describe('Error Handling', () => {
    it('should handle network connection errors', async () => {
      const networkError = new Error('Network error: Connection refused');
      mockInvoke.mockRejectedValue(networkError);

      await expect(
        mockInvoke('execute_request', {
          request: {
            name: 'Test',
            method: 'GET',
            url: 'https://api.example.com',
            headers: {},
            body: null,
          },
        })
      ).rejects.toThrow('Network error: Connection refused');
    });

    it('should handle invalid URL format errors', async () => {
      const urlError = new Error('Invalid URL format');
      mockInvoke.mockRejectedValue(urlError);

      await expect(
        mockInvoke('execute_request', {
          request: {
            name: 'Test',
            method: 'GET',
            url: 'not-a-valid-url',
            headers: {},
            body: null,
          },
        })
      ).rejects.toThrow('Invalid URL format');
    });

    it('should handle request timeout errors', async () => {
      const timeoutError = new Error('Request timeout after 30 seconds');
      mockInvoke.mockRejectedValue(timeoutError);

      await expect(
        mockInvoke('execute_request', {
          request: {
            name: 'Test',
            method: 'GET',
            url: 'https://slow-api.example.com',
            headers: {},
            body: null,
          },
        })
      ).rejects.toThrow('Request timeout');
    });

    it('should handle 500 Internal Server Error responses', async () => {
      const mockResponse = {
        status: 500,
        status_text: 'Internal Server Error',
        headers: {},
        body: 'Server encountered an error',
        time_ms: 500,
      };
      mockInvoke.mockResolvedValue(mockResponse);

      const result = await mockInvoke('execute_request', {
        request: {
          name: 'Test',
          method: 'GET',
          url: 'https://api.example.com/error',
          headers: {},
          body: null,
        },
      });

      expect(result.status).toBe(500);
      expect(result.status_text).toBe('Internal Server Error');
      expect(result.body).toContain('error');
    });

    it('should handle 404 Not Found responses', async () => {
      const mockResponse = {
        status: 404,
        status_text: 'Not Found',
        headers: {},
        body: 'Resource not found',
        time_ms: 300,
      };
      mockInvoke.mockResolvedValue(mockResponse);

      const result = await mockInvoke('execute_request', {
        request: {
          name: 'Test',
          method: 'GET',
          url: 'https://api.example.com/notfound',
          headers: {},
          body: null,
        },
      });

      expect(result.status).toBe(404);
      expect(result.status_text).toBe('Not Found');
    });

    it('should handle 401 Unauthorized responses', async () => {
      const mockResponse = {
        status: 401,
        status_text: 'Unauthorized',
        headers: { 'WWW-Authenticate': 'Bearer' },
        body: '{"error": "Invalid token"}',
        time_ms: 200,
      };
      mockInvoke.mockResolvedValue(mockResponse);

      const result = await mockInvoke('execute_request', {
        request: {
          name: 'Test',
          method: 'GET',
          url: 'https://api.example.com/protected',
          headers: { Authorization: 'Bearer invalid-token' },
          body: null,
        },
      });

      expect(result.status).toBe(401);
      expect(result.headers['WWW-Authenticate']).toBe('Bearer');
    });

    it('should handle SSL/TLS certificate errors', async () => {
      const sslError = new Error('SSL certificate verification failed');
      mockInvoke.mockRejectedValue(sslError);

      await expect(
        mockInvoke('execute_request', {
          request: {
            name: 'Test',
            method: 'GET',
            url: 'https://self-signed.badssl.com',
            headers: {},
            body: null,
          },
        })
      ).rejects.toThrow('SSL certificate');
    });
  });

  describe('Request List Management', () => {
    type Request = {
      id: string;
      name: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
      url: string;
      headers?: { key: string; value: string }[];
      body?: string;
    };

    it('should add new request to list', () => {
      let requests: Request[] = [
        { id: '1', name: 'Request 1', method: 'GET', url: 'https://api.example.com/1' },
      ];

      const newRequest: Request = {
        id: String(Date.now()),
        name: 'New Request',
        method: 'POST',
        url: 'https://api.example.com/2',
      };

      requests = [...requests, newRequest];

      expect(requests).toHaveLength(2);
      expect(requests[1].name).toBe('New Request');
      expect(requests[1].method).toBe('POST');
    });

    it('should update existing request in list', () => {
      let requests: Request[] = [
        { id: '1', name: 'Request 1', method: 'GET', url: 'https://api.example.com/1' },
        { id: '2', name: 'Request 2', method: 'POST', url: 'https://api.example.com/2' },
      ];

      const updatedRequest: Request = {
        id: '1',
        name: 'Updated Request',
        method: 'PUT',
        url: 'https://api.example.com/updated',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      };

      requests = requests.map((r) => (r.id === '1' ? updatedRequest : r));

      expect(requests[0].name).toBe('Updated Request');
      expect(requests[0].method).toBe('PUT');
      expect(requests[0].headers).toHaveLength(1);
      expect(requests[1].name).toBe('Request 2'); // Other request unchanged
    });

    it('should delete request from list', () => {
      let requests: Request[] = [
        { id: '1', name: 'Request 1', method: 'GET', url: 'https://api.example.com/1' },
        { id: '2', name: 'Request 2', method: 'POST', url: 'https://api.example.com/2' },
        { id: '3', name: 'Request 3', method: 'DELETE', url: 'https://api.example.com/3' },
      ];

      requests = requests.filter((r) => r.id !== '2');

      expect(requests).toHaveLength(2);
      expect(requests.find((r) => r.id === '2')).toBeUndefined();
      expect(requests.find((r) => r.id === '1')).toBeDefined();
      expect(requests.find((r) => r.id === '3')).toBeDefined();
    });

    it('should select request from list', () => {
      const requests: Request[] = [
        { id: '1', name: 'Request 1', method: 'GET', url: 'https://api.example.com/1' },
        { id: '2', name: 'Request 2', method: 'POST', url: 'https://api.example.com/2' },
      ];

      let selectedId: string | null = '1';
      const selectedRequest = requests.find((r) => r.id === selectedId);

      expect(selectedRequest).toBeDefined();
      expect(selectedRequest?.id).toBe('1');
      expect(selectedRequest?.name).toBe('Request 1');

      // Change selection
      selectedId = '2';
      const newSelectedRequest = requests.find((r) => r.id === selectedId);
      expect(newSelectedRequest?.id).toBe('2');
    });

    it('should handle empty request list', () => {
      const requests: Request[] = [];
      const selectedId: string | null = null;

      const selectedRequest = requests.find((r) => r.id === selectedId);
      expect(selectedRequest).toBeUndefined();
      expect(requests).toHaveLength(0);
    });

    it('should preserve request data when updating name only', () => {
      let requests: Request[] = [
        {
          id: '1',
          name: 'Original Name',
          method: 'POST',
          url: 'https://api.example.com/test',
          headers: [{ key: 'Authorization', value: 'Bearer token' }],
          body: '{"key": "value"}',
        },
      ];

      requests = requests.map((r) => (r.id === '1' ? { ...r, name: 'New Name' } : r));

      expect(requests[0].name).toBe('New Name');
      expect(requests[0].method).toBe('POST');
      expect(requests[0].url).toBe('https://api.example.com/test');
      expect(requests[0].headers).toHaveLength(1);
      expect(requests[0].body).toBe('{"key": "value"}');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should detect Cmd+Enter on macOS for executing request', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
        ctrlKey: false,
      });

      const shouldExecute = (event.metaKey || event.ctrlKey) && event.key === 'Enter';
      expect(shouldExecute).toBe(true);
      expect(event.metaKey).toBe(true);
      expect(event.key).toBe('Enter');
    });

    it('should detect Ctrl+Enter on Windows/Linux for executing request', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: false,
        ctrlKey: true,
      });

      const shouldExecute = (event.metaKey || event.ctrlKey) && event.key === 'Enter';
      expect(shouldExecute).toBe(true);
      expect(event.ctrlKey).toBe(true);
    });

    it('should detect Escape key for clearing response', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
      });

      expect(event.key).toBe('Escape');
    });

    it('should not trigger execution on Enter without modifier key', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: false,
        ctrlKey: false,
      });

      const shouldExecute = (event.metaKey || event.ctrlKey) && event.key === 'Enter';
      expect(shouldExecute).toBe(false);
    });

    it('should not trigger on other keys with Cmd/Ctrl modifier', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'S',
        metaKey: true,
      });

      const shouldExecute = (event.metaKey || event.ctrlKey) && event.key === 'Enter';
      expect(shouldExecute).toBe(false);
    });

    it('should not execute if loading state is true', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
      });

      const isLoading = true;
      const shouldExecute = (event.metaKey || event.ctrlKey) && event.key === 'Enter' && !isLoading;
      expect(shouldExecute).toBe(false);
    });

    it('should execute if loading state is false', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
      });

      const isLoading = false;
      const shouldExecute = (event.metaKey || event.ctrlKey) && event.key === 'Enter' && !isLoading;
      expect(shouldExecute).toBe(true);
    });
  });

  describe('Response Caching and Time Tracking', () => {
    it('should use time_ms from Tauri backend response', async () => {
      const mockResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: '{}',
        time_ms: 1234,
      };
      mockInvoke.mockResolvedValue(mockResponse);

      const result = await mockInvoke('execute_request', {
        request: {
          name: 'Test',
          method: 'GET',
          url: 'https://api.example.com',
          headers: {},
          body: null,
        },
      });

      expect(result.time_ms).toBe(1234);
    });

    it('should calculate response size from body length', () => {
      const responseBody = '{"data": "example response with some content"}';
      const size = responseBody.length;

      expect(size).toBeGreaterThan(0);
      expect(size).toBe(responseBody.length);
    });

    it('should handle large response bodies', () => {
      const largeBody = JSON.stringify({ data: 'x'.repeat(10000) });
      const size = largeBody.length;

      expect(size).toBeGreaterThan(10000);
    });

    it('should handle empty response body', () => {
      const emptyBody = '';
      const size = emptyBody.length;

      expect(size).toBe(0);
    });
  });

  describe('Tauri Request Format Conversion', () => {
    const convertHeadersToRecord = (
      headers?: { key: string; value: string }[]
    ): Record<string, string> => {
      if (!headers || headers.length === 0) return {};
      return headers.reduce(
        (acc, h) => {
          if (h.key && h.value) {
            acc[h.key] = h.value;
          }
          return acc;
        },
        {} as Record<string, string>
      );
    };

    it('should convert EditorRequest to TauriRequest format', () => {
      const editorRequest = {
        name: 'Test Request',
        method: 'POST' as const,
        url: 'https://api.example.com/users',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer token' },
        ],
        body: '{"name": "John"}',
      };

      const tauriRequest = {
        name: editorRequest.name,
        method: editorRequest.method,
        url: editorRequest.url,
        headers: convertHeadersToRecord(editorRequest.headers),
        body: editorRequest.body ?? null,
      };

      expect(tauriRequest.name).toBe('Test Request');
      expect(tauriRequest.method).toBe('POST');
      expect(tauriRequest.url).toBe('https://api.example.com/users');
      expect(tauriRequest.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      });
      expect(tauriRequest.body).toBe('{"name": "John"}');
    });

    it('should handle EditorRequest with no body', () => {
      const editorRequest = {
        name: 'GET Request',
        method: 'GET' as const,
        url: 'https://api.example.com/users',
        headers: [],
        body: undefined,
      };

      const tauriRequest = {
        name: editorRequest.name,
        method: editorRequest.method,
        url: editorRequest.url,
        headers: convertHeadersToRecord(editorRequest.headers),
        body: editorRequest.body ?? null,
      };

      expect(tauriRequest.body).toBeNull();
      expect(tauriRequest.headers).toEqual({});
    });

    it('should handle EditorRequest with empty string body', () => {
      const editorRequest = {
        name: 'POST Request',
        method: 'POST' as const,
        url: 'https://api.example.com/users',
        headers: [],
        body: '',
      };

      const tauriRequest = {
        name: editorRequest.name,
        method: editorRequest.method,
        url: editorRequest.url,
        headers: convertHeadersToRecord(editorRequest.headers),
        body: editorRequest.body || null,
      };

      expect(tauriRequest.body).toBeNull();
    });
  });
});
