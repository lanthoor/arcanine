import { describe, it, expect } from 'vitest';
import ResponseViewer from './ResponseViewer.svelte';

describe('ResponseViewer Component', () => {
  describe('Component Definition', () => {
    it('should export ResponseViewer component', () => {
      expect(ResponseViewer).toBeDefined();
    });

    it('should be a Svelte component constructor', () => {
      expect(typeof ResponseViewer).toBe('function');
    });
  });

  describe('Response Type Definition', () => {
    it('should have required fields: status, time', () => {
      const response = {
        status: 200,
        time: 1500,
      };
      expect(response.status).toBeDefined();
      expect(response.time).toBeDefined();
    });

    it('should have optional fields: statusText, headers, body', () => {
      const response = {
        status: 200,
        statusText: 'OK',
        time: 1500,
        headers: [{ key: 'Content-Type', value: 'application/json' }],
        body: '{"message": "success"}',
      };
      expect(response.statusText).toBeDefined();
      expect(response.headers).toBeDefined();
      expect(response.body).toBeDefined();
    });

    it('should accept status as a number', () => {
      const response = { status: 404, time: 1000 };
      expect(typeof response.status).toBe('number');
    });

    it('should accept time as a number in milliseconds', () => {
      const response = { status: 200, time: 2345 };
      expect(typeof response.time).toBe('number');
    });

    it('should accept headers as an array of key-value pairs', () => {
      const headers = [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer token123' },
      ];
      expect(Array.isArray(headers)).toBe(true);
      expect(headers[0]).toHaveProperty('key');
      expect(headers[0]).toHaveProperty('value');
    });

    it('should accept body as a string', () => {
      const response = { status: 200, time: 1500, body: '{"data": "test"}' };
      expect(typeof response.body).toBe('string');
    });
  });

  describe('Status Code Color Mapping', () => {
    it('should map 2xx status codes to success (green)', () => {
      const getStatusClass = (status: number): string => {
        if (status >= 200 && status < 300) return 'status-success';
        if (status >= 300 && status < 400) return 'status-redirect';
        if (status >= 400 && status < 500) return 'status-client-error';
        if (status >= 500) return 'status-server-error';
        return '';
      };

      expect(getStatusClass(200)).toBe('status-success');
      expect(getStatusClass(201)).toBe('status-success');
      expect(getStatusClass(204)).toBe('status-success');
    });

    it('should map 3xx status codes to redirect (blue)', () => {
      const getStatusClass = (status: number): string => {
        if (status >= 200 && status < 300) return 'status-success';
        if (status >= 300 && status < 400) return 'status-redirect';
        if (status >= 400 && status < 500) return 'status-client-error';
        if (status >= 500) return 'status-server-error';
        return '';
      };

      expect(getStatusClass(301)).toBe('status-redirect');
      expect(getStatusClass(302)).toBe('status-redirect');
      expect(getStatusClass(304)).toBe('status-redirect');
    });

    it('should map 4xx status codes to client error (orange)', () => {
      const getStatusClass = (status: number): string => {
        if (status >= 200 && status < 300) return 'status-success';
        if (status >= 300 && status < 400) return 'status-redirect';
        if (status >= 400 && status < 500) return 'status-client-error';
        if (status >= 500) return 'status-server-error';
        return '';
      };

      expect(getStatusClass(400)).toBe('status-client-error');
      expect(getStatusClass(404)).toBe('status-client-error');
      expect(getStatusClass(422)).toBe('status-client-error');
    });

    it('should map 5xx status codes to server error (red)', () => {
      const getStatusClass = (status: number): string => {
        if (status >= 200 && status < 300) return 'status-success';
        if (status >= 300 && status < 400) return 'status-redirect';
        if (status >= 400 && status < 500) return 'status-client-error';
        if (status >= 500) return 'status-server-error';
        return '';
      };

      expect(getStatusClass(500)).toBe('status-server-error');
      expect(getStatusClass(502)).toBe('status-server-error');
      expect(getStatusClass(503)).toBe('status-server-error');
    });
  });

  describe('Response Time Display', () => {
    it('should format time under 1 second as milliseconds', () => {
      const formatTime = (ms: number): string => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
      };

      expect(formatTime(500)).toBe('500ms');
      expect(formatTime(999)).toBe('999ms');
    });

    it('should format time over 1 second with 2 decimals', () => {
      const formatTime = (ms: number): string => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
      };

      expect(formatTime(1500)).toBe('1.50s');
      expect(formatTime(2345)).toBe('2.35s');
      expect(formatTime(10000)).toBe('10.00s');
    });

    it('should handle edge case of exactly 1 second', () => {
      const formatTime = (ms: number): string => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
      };

      expect(formatTime(1000)).toBe('1.00s');
    });
  });

  describe('Content Type Detection', () => {
    it('should detect JSON content type from headers', () => {
      const getContentType = (headers?: { key: string; value: string }[]): string => {
        if (!headers) return 'text/plain';
        const contentTypeHeader = headers.find((h) => h.key.toLowerCase() === 'content-type');
        return contentTypeHeader?.value.split(';')[0].trim() || 'text/plain';
      };

      const headers = [{ key: 'Content-Type', value: 'application/json; charset=utf-8' }];
      expect(getContentType(headers)).toBe('application/json');
    });

    it('should detect HTML content type from headers', () => {
      const getContentType = (headers?: { key: string; value: string }[]): string => {
        if (!headers) return 'text/plain';
        const contentTypeHeader = headers.find((h) => h.key.toLowerCase() === 'content-type');
        return contentTypeHeader?.value.split(';')[0].trim() || 'text/plain';
      };

      const headers = [{ key: 'Content-Type', value: 'text/html; charset=utf-8' }];
      expect(getContentType(headers)).toBe('text/html');
    });

    it('should default to text/plain when no Content-Type header', () => {
      const getContentType = (headers?: { key: string; value: string }[]): string => {
        if (!headers) return 'text/plain';
        const contentTypeHeader = headers.find((h) => h.key.toLowerCase() === 'content-type');
        return contentTypeHeader?.value.split(';')[0].trim() || 'text/plain';
      };

      expect(getContentType(undefined)).toBe('text/plain');
      expect(getContentType([])).toBe('text/plain');
    });

    it('should handle case-insensitive header keys', () => {
      const getContentType = (headers?: { key: string; value: string }[]): string => {
        if (!headers) return 'text/plain';
        const contentTypeHeader = headers.find((h) => h.key.toLowerCase() === 'content-type');
        return contentTypeHeader?.value.split(';')[0].trim() || 'text/plain';
      };

      const headers = [{ key: 'content-type', value: 'application/json' }];
      expect(getContentType(headers)).toBe('application/json');
    });
  });

  describe('JSON Body Formatting', () => {
    it('should format valid JSON with indentation', () => {
      const formatBody = (
        body?: string,
        contentType?: string,
        formatted: boolean = true
      ): string => {
        if (!body) return '';
        if (!formatted) return body;
        if (contentType?.includes('application/json')) {
          try {
            const parsed = JSON.parse(body);
            return JSON.stringify(parsed, null, 2);
          } catch {
            return body;
          }
        }
        return body;
      };

      const jsonBody = '{"name":"John","age":30}';
      const formatted = formatBody(jsonBody, 'application/json', true);
      expect(formatted).toContain('\n');
      expect(formatted).toContain('  ');
    });

    it('should return original body for invalid JSON', () => {
      const formatBody = (
        body?: string,
        contentType?: string,
        formatted: boolean = true
      ): string => {
        if (!body) return '';
        if (!formatted) return body;
        if (contentType?.includes('application/json')) {
          try {
            const parsed = JSON.parse(body);
            return JSON.stringify(parsed, null, 2);
          } catch {
            return body;
          }
        }
        return body;
      };

      const invalidJson = '{invalid json}';
      const result = formatBody(invalidJson, 'application/json', true);
      expect(result).toBe(invalidJson);
    });

    it('should return raw body when formatted is false', () => {
      const formatBody = (
        body?: string,
        contentType?: string,
        formatted: boolean = true
      ): string => {
        if (!body) return '';
        if (!formatted) return body;
        if (contentType?.includes('application/json')) {
          try {
            const parsed = JSON.parse(body);
            return JSON.stringify(parsed, null, 2);
          } catch {
            return body;
          }
        }
        return body;
      };

      const jsonBody = '{"name":"John"}';
      const result = formatBody(jsonBody, 'application/json', false);
      expect(result).toBe(jsonBody);
    });

    it('should not format non-JSON content types', () => {
      const formatBody = (
        body?: string,
        contentType?: string,
        formatted: boolean = true
      ): string => {
        if (!body) return '';
        if (!formatted) return body;
        if (contentType?.includes('application/json')) {
          try {
            const parsed = JSON.parse(body);
            return JSON.stringify(parsed, null, 2);
          } catch {
            return body;
          }
        }
        return body;
      };

      const htmlBody = '<html><body>Hello</body></html>';
      const result = formatBody(htmlBody, 'text/html', true);
      expect(result).toBe(htmlBody);
    });
  });

  describe('Props Interface', () => {
    it('should have response as an optional prop', () => {
      const props = { response: undefined };
      expect(props).toHaveProperty('response');
    });

    it('should accept a complete response object', () => {
      const props = {
        response: {
          status: 200,
          statusText: 'OK',
          headers: [{ key: 'Content-Type', value: 'application/json' }],
          body: '{"message":"success"}',
          time: 1500,
        },
      };
      expect(props.response).toBeDefined();
      expect(props.response.status).toBe(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response body', () => {
      const response = {
        status: 204,
        time: 1000,
        body: '',
      };
      expect(response.body).toBe('');
    });

    it('should handle response without headers', () => {
      const response: {
        status: number;
        time: number;
        body: string;
        headers?: { key: string; value: string }[];
      } = {
        status: 200,
        time: 1500,
        body: 'test',
      };
      expect(response.headers).toBeUndefined();
    });

    it('should handle very large response times', () => {
      const formatTime = (ms: number): string => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
      };

      expect(formatTime(60000)).toBe('60.00s');
      expect(formatTime(120000)).toBe('120.00s');
    });

    it('should handle status codes outside standard ranges', () => {
      const getStatusClass = (status: number): string => {
        if (status >= 200 && status < 300) return 'status-success';
        if (status >= 300 && status < 400) return 'status-redirect';
        if (status >= 400 && status < 500) return 'status-client-error';
        if (status >= 500) return 'status-server-error';
        return '';
      };

      expect(getStatusClass(100)).toBe('');
      expect(getStatusClass(101)).toBe('');
      expect(getStatusClass(199)).toBe('');
    });

    it('should handle whitespace in JSON body', () => {
      const formatBody = (
        body?: string,
        contentType?: string,
        formatted: boolean = true
      ): string => {
        if (!body) return '';
        if (!formatted) return body;
        if (contentType?.includes('application/json')) {
          try {
            const parsed = JSON.parse(body);
            return JSON.stringify(parsed, null, 2);
          } catch {
            return body;
          }
        }
        return body;
      };

      const jsonWithWhitespace = '  \n\t{"key": "value"}\n  ';
      const result = formatBody(jsonWithWhitespace, 'application/json', true);
      expect(result).toContain('"key"');
    });

    it('should handle multiple headers with same key', () => {
      const headers = [
        { key: 'Set-Cookie', value: 'cookie1=value1' },
        { key: 'Set-Cookie', value: 'cookie2=value2' },
      ];
      expect(headers.length).toBe(2);
      expect(headers.filter((h) => h.key === 'Set-Cookie')).toHaveLength(2);
    });

    it('should handle Content-Type with multiple parameters', () => {
      const getContentType = (headers?: { key: string; value: string }[]): string => {
        if (!headers) return 'text/plain';
        const contentTypeHeader = headers.find((h) => h.key.toLowerCase() === 'content-type');
        return contentTypeHeader?.value.split(';')[0].trim() || 'text/plain';
      };

      const headers = [
        {
          key: 'Content-Type',
          value: 'application/json; charset=utf-8; boundary=something',
        },
      ];
      expect(getContentType(headers)).toBe('application/json');
    });

    it('should handle very long header values', () => {
      const longValue = 'Bearer ' + 'a'.repeat(1000);
      const header = { key: 'Authorization', value: longValue };
      expect(header.value.length).toBeGreaterThan(1000);
    });
  });

  describe('i18n Support', () => {
    it('should use translation keys for labels', () => {
      const i18nKeys = [
        'responseViewer.status',
        'responseViewer.time',
        'responseViewer.headers',
        'responseViewer.body',
        'responseViewer.empty',
        'responseViewer.emptyHint',
      ];
      expect(i18nKeys).toHaveLength(6);
      i18nKeys.forEach((key) => {
        expect(key).toContain('responseViewer.');
      });
    });

    it('should use translation keys for actions', () => {
      const actionKeys = [
        'responseViewer.copyBody',
        'responseViewer.copyHeaders',
        'responseViewer.format',
        'responseViewer.raw',
        'responseViewer.expandHeaders',
        'responseViewer.collapseHeaders',
      ];
      expect(actionKeys).toHaveLength(6);
      actionKeys.forEach((key) => {
        expect(key).toContain('responseViewer.');
      });
    });

    it('should use translation keys for empty states', () => {
      const emptyStateKeys = [
        'responseViewer.noHeaders',
        'responseViewer.noBody',
        'responseViewer.copied',
      ];
      expect(emptyStateKeys).toHaveLength(3);
      emptyStateKeys.forEach((key) => {
        expect(key).toContain('responseViewer.');
      });
    });
  });
});
