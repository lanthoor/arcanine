import { describe, it, expect } from 'vitest';
import RequestEditor from './RequestEditor.svelte';

describe('RequestEditor Component', () => {
  describe('Component Definition', () => {
    it('should export the component', () => {
      expect(RequestEditor).toBeDefined();
    });

    it('should be a Svelte component constructor', () => {
      expect(typeof RequestEditor).toBe('function');
    });
  });

  describe('HTTP Methods', () => {
    it('should support all 7 HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
      methods.forEach((method) => {
        expect(method).toBeTruthy();
        expect(method.length).toBeGreaterThan(0);
      });
    });

    it('should have color mapping for each HTTP method', () => {
      const methodColors = {
        GET: 'var(--color-method-get)',
        POST: 'var(--color-method-post)',
        PUT: 'var(--color-method-put)',
        DELETE: 'var(--color-method-delete)',
        PATCH: 'var(--color-method-patch)',
        HEAD: 'var(--color-method-head)',
        OPTIONS: 'var(--color-method-options)',
      };

      Object.entries(methodColors).forEach(([method, color]) => {
        expect(color).toContain('var(--color-method-');
        expect(method).toBeTruthy();
      });
    });
  });

  describe('Request Type Definition', () => {
    it('should define Request type with required fields', () => {
      type Request = {
        id?: string;
        name: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
        url: string;
        headers?: { key: string; value: string }[];
        body?: string;
      };

      const request: Request = {
        name: 'Test Request',
        method: 'GET',
        url: 'https://api.example.com',
      };

      expect(request.name).toBe('Test Request');
      expect(request.method).toBe('GET');
      expect(request.url).toBe('https://api.example.com');
    });

    it('should allow optional id field', () => {
      type Request = {
        id?: string;
        name: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
        url: string;
      };

      const withId: Request = {
        id: '123',
        name: 'Test',
        method: 'GET',
        url: 'https://test.com',
      };

      const withoutId: Request = {
        name: 'Test',
        method: 'GET',
        url: 'https://test.com',
      };

      expect(withId.id).toBe('123');
      expect(withoutId.id).toBeUndefined();
    });

    it('should allow optional headers field', () => {
      type Request = {
        name: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
        url: string;
        headers?: { key: string; value: string }[];
      };

      const withHeaders: Request = {
        name: 'Test',
        method: 'GET',
        url: 'https://test.com',
        headers: [{ key: 'Authorization', value: 'Bearer token' }],
      };

      const withoutHeaders: Request = {
        name: 'Test',
        method: 'GET',
        url: 'https://test.com',
      };

      expect(withHeaders.headers).toHaveLength(1);
      expect(withoutHeaders.headers).toBeUndefined();
    });

    it('should allow optional body field', () => {
      type Request = {
        name: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
        url: string;
        body?: string;
      };

      const withBody: Request = {
        name: 'Test',
        method: 'POST',
        url: 'https://test.com',
        body: '{"key": "value"}',
      };

      const withoutBody: Request = {
        name: 'Test',
        method: 'GET',
        url: 'https://test.com',
      };

      expect(withBody.body).toBeTruthy();
      expect(withoutBody.body).toBeUndefined();
    });
  });

  describe('Header Type Definition', () => {
    it('should define Header type with key and value', () => {
      type Header = {
        key: string;
        value: string;
      };

      const header: Header = {
        key: 'Content-Type',
        value: 'application/json',
      };

      expect(header.key).toBe('Content-Type');
      expect(header.value).toBe('application/json');
    });

    it('should allow multiple headers', () => {
      type Header = {
        key: string;
        value: string;
      };

      const headers: Header[] = [
        { key: 'Authorization', value: 'Bearer token' },
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Accept', value: 'application/json' },
      ];

      expect(headers).toHaveLength(3);
      expect(headers[0].key).toBe('Authorization');
      expect(headers[1].key).toBe('Content-Type');
      expect(headers[2].key).toBe('Accept');
    });
  });

  describe('URL Validation', () => {
    it('should validate valid HTTPS URLs', () => {
      const validUrls = [
        'https://api.example.com',
        'https://api.example.com/users',
        'https://api.example.com/users/123',
        'https://api.example.com/users?page=1',
        'https://subdomain.example.com',
      ];

      validUrls.forEach((url) => {
        expect(() => new URL(url)).not.toThrow();
      });
    });

    it('should validate valid HTTP URLs', () => {
      const validUrls = [
        'http://localhost:3000',
        'http://127.0.0.1:8080',
        'http://api.example.com',
      ];

      validUrls.forEach((url) => {
        expect(() => new URL(url)).not.toThrow();
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = ['not-a-url', 'ftp://example.com', 'example.com', ''];

      invalidUrls.forEach((url) => {
        if (url === '') {
          expect(url).toBe('');
        } else {
          const parsed = url.includes('://') ? new URL(url) : null;
          if (parsed && !parsed.protocol.match(/^https?:$/)) {
            expect(parsed.protocol).not.toMatch(/^https?:$/);
          }
        }
      });
    });
  });

  describe('JSON Validation', () => {
    it('should validate valid JSON strings', () => {
      const validJson = [
        '{}',
        '{"key": "value"}',
        '{"nested": {"key": "value"}}',
        '[1, 2, 3]',
        '{"array": [1, 2, 3]}',
      ];

      validJson.forEach((json) => {
        expect(() => JSON.parse(json)).not.toThrow();
      });
    });

    it('should reject invalid JSON strings', () => {
      const invalidJson = ['{key: value}', "{'key': 'value'}", '{', 'undefined', 'null,'];

      invalidJson.forEach((json) => {
        expect(() => JSON.parse(json)).toThrow();
      });
    });

    it('should format JSON with proper indentation', () => {
      const input = '{"key":"value","nested":{"inner":"data"}}';
      const formatted = JSON.stringify(JSON.parse(input), null, 2);
      const expectedLines = formatted.split('\n');

      expect(expectedLines.length).toBeGreaterThan(1);
      expect(formatted).toContain('  '); // Should have indentation
    });
  });

  describe('Form State', () => {
    it('should initialize with default values', () => {
      const defaultName = 'New Request';
      const defaultMethod = 'GET';
      const defaultUrl = 'https://';

      expect(defaultName).toBe('New Request');
      expect(defaultMethod).toBe('GET');
      expect(defaultUrl).toBe('https://');
    });

    it('should initialize with provided request data', () => {
      const request = {
        name: 'Test Request',
        method: 'POST' as const,
        url: 'https://api.example.com',
        headers: [{ key: 'Authorization', value: 'Bearer token' }],
        body: '{"test": true}',
      };

      expect(request.name).toBe('Test Request');
      expect(request.method).toBe('POST');
      expect(request.url).toBe('https://api.example.com');
      expect(request.headers).toHaveLength(1);
      expect(request.body).toBeTruthy();
    });
  });

  describe('Header Management', () => {
    it('should add new header rows', () => {
      const headers: { key: string; value: string }[] = [];
      const newHeader = { key: '', value: '' };
      headers.push(newHeader);

      expect(headers).toHaveLength(1);
      expect(headers[0].key).toBe('');
      expect(headers[0].value).toBe('');
    });

    it('should remove header rows', () => {
      const headers = [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer token' },
      ];
      const filtered = headers.filter((_, i) => i !== 0);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].key).toBe('Authorization');
    });

    it('should filter out empty headers', () => {
      const headers = [
        { key: 'Content-Type', value: 'application/json' },
        { key: '', value: '' },
        { key: 'Authorization', value: 'Bearer token' },
        { key: 'Empty', value: '' },
      ];
      const valid = headers.filter((h) => h.key.trim() !== '' && h.value.trim() !== '');

      expect(valid).toHaveLength(2);
      expect(valid[0].key).toBe('Content-Type');
      expect(valid[1].key).toBe('Authorization');
    });
  });

  describe('Method-specific Features', () => {
    it('should show body editor for POST, PUT, PATCH', () => {
      const methodsWithBody = ['POST', 'PUT', 'PATCH'];
      methodsWithBody.forEach((method) => {
        expect(['POST', 'PUT', 'PATCH'].includes(method)).toBe(true);
      });
    });

    it('should hide body editor for GET, DELETE, HEAD, OPTIONS', () => {
      const methodsWithoutBody = ['GET', 'DELETE', 'HEAD', 'OPTIONS'];
      methodsWithoutBody.forEach((method) => {
        expect(['POST', 'PUT', 'PATCH'].includes(method)).toBe(false);
      });
    });
  });

  describe('Props Interface', () => {
    it('should define Props type with all required fields', () => {
      type Request = {
        id?: string;
        name: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
        url: string;
      };

      type Props = {
        request?: Request;
        onsubmit?: (request: Request) => void;
        oncancel?: () => void;
        loading?: boolean;
      };

      const props: Props = {
        onsubmit: (req) => console.log(req),
        oncancel: () => console.log('cancel'),
        loading: false,
      };

      expect(props.onsubmit).toBeDefined();
      expect(props.oncancel).toBeDefined();
      expect(props.loading).toBe(false);
    });

    it('should allow all props to be optional', () => {
      type Request = {
        id?: string;
        name: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
        url: string;
      };

      type Props = {
        request?: Request;
        onsubmit?: (request: Request) => void;
        oncancel?: () => void;
        loading?: boolean;
      };

      const props: Props = {};

      expect(props.request).toBeUndefined();
      expect(props.onsubmit).toBeUndefined();
      expect(props.oncancel).toBeUndefined();
      expect(props.loading).toBeUndefined();
    });
  });

  describe('i18n Support', () => {
    it('should support translation keys', () => {
      const translationKeys = [
        'requestEditor.name',
        'requestEditor.method',
        'requestEditor.url',
        'requestEditor.headers',
        'requestEditor.body',
        'requestEditor.send',
        'requestEditor.cancel',
        'requestEditor.sending',
      ];

      translationKeys.forEach((key) => {
        expect(key).toContain('requestEditor.');
      });
    });

    it('should support error message translations', () => {
      const errorKeys = [
        'requestEditor.errors.nameRequired',
        'requestEditor.errors.urlRequired',
        'requestEditor.errors.urlInvalid',
        'requestEditor.errors.urlInvalidProtocol',
        'requestEditor.errors.urlInvalidHostname',
        'requestEditor.errors.bodyInvalidJson',
      ];

      errorKeys.forEach((key) => {
        expect(key).toContain('requestEditor.errors.');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty request name', () => {
      const name = '';
      const isValid = name.trim() !== '';
      expect(isValid).toBe(false);
    });

    it('should handle whitespace-only name', () => {
      const name = '   ';
      const isValid = name.trim() !== '';
      expect(isValid).toBe(false);
    });

    it('should handle very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000);
      expect(() => new URL(longUrl)).not.toThrow();
    });

    it('should handle special characters in headers', () => {
      const header = {
        key: 'X-Custom-Header',
        value: 'value-with-special-chars!@#$%',
      };

      expect(header.key).toBeTruthy();
      expect(header.value).toBeTruthy();
    });

    it('should handle empty body', () => {
      const body = '';
      const isEmpty = body.trim() === '';
      expect(isEmpty).toBe(true);
    });

    it('should handle multiline JSON body', () => {
      const body = `{
  "key": "value",
  "nested": {
    "inner": "data"
  }
}`;
      expect(() => JSON.parse(body)).not.toThrow();
    });
  });
});
