# YAML Schema Reference

Complete reference for all YAML file formats used in Arcanine collections.

## Table of Contents

- [Collection Metadata](#collection-metadata)
- [Folder Metadata](#folder-metadata)
- [Request File](#request-file)
- [Environment File](#environment-file)
- [Secrets File](#secrets-file)
- [Common Patterns](#common-patterns)

## Collection Metadata

**File**: `collection.yaml` (collection root directory)

```yaml
# Schema version for future compatibility
version: "1.0"

# Collection identification
id: "550e8400-e29b-41d4-a716-446655440000"  # UUID, auto-generated
name: "My API Collection"                    # Display name
description: "Comprehensive API endpoints"   # Brief description

# Metadata
metadata:
  version: "2.1.0"                          # User-defined version
  author: "John Doe"                        # Author name
  created: "2024-01-15T10:30:00Z"          # ISO 8601 timestamp
  updated: "2024-11-29T16:15:00Z"          # ISO 8601 timestamp
  tags:                                     # Optional tags
    - "rest-api"
    - "backend"

# Documentation (Markdown supported)
documentation: |
  # MyService API Collection
  
  This collection contains all endpoints for MyService API.

# Global collection settings
settings:
  timeout: 30000                            # Default timeout (ms)
  followRedirects: true                     # Follow HTTP redirects
  maxRedirects: 5                           # Max redirect hops
  
  ssl:
    validateCertificates: true              # Validate SSL certs
    clientCertificate: null                 # Path to client cert
  
  proxy:
    enabled: false
    url: null                               # e.g., "http://proxy:8080"
    auth:
      username: null
      password: null
  
  maxResponseSize: 10485760                 # 10MB in bytes
  saveResponseHistory: true                 # Save to SQLite

# Global variables (available in all environments)
variables:
  apiVersion: "v1"
  contentType: "application/json"
  defaultTimeout: 5000

# Global authentication (can be overridden)
auth:
  type: null                                # null, bearer, basic, oauth2, etc.

# Global pre-request script
preRequestScript: |
  // Runs before every request
  console.log(`[${new Date().toISOString()}] Executing request...`);
  request.headers.set("X-Request-ID", crypto.randomUUID());

# Global post-response script
postResponseScript: |
  // Runs after every request
  console.log(`Response status: ${response.status}`);
  if (response.status >= 400) {
    console.error(`Request failed: ${response.statusText}`);
  }

# Global test scripts
tests:
  - name: "Response time is acceptable"
    script: |
      assert(response.time < 2000, "Response time should be under 2s");
  
  - name: "No server errors"
    script: |
      assert(response.status < 500, "No 5xx server errors");
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Schema version ("1.0") |
| `id` | string | Yes | UUID for collection |
| `name` | string | Yes | Display name |
| `description` | string | No | Description text |
| `metadata` | object | No | Additional metadata |
| `metadata.version` | string | No | User-defined version |
| `metadata.author` | string | No | Author name |
| `metadata.created` | string | No | ISO 8601 timestamp |
| `metadata.updated` | string | No | ISO 8601 timestamp |
| `metadata.tags` | array | No | List of tags |
| `documentation` | string | No | Markdown documentation |
| `settings` | object | No | Collection-wide settings |
| `variables` | object | No | Global variables |
| `auth` | object | No | Global authentication |
| `preRequestScript` | string | No | JavaScript code |
| `postResponseScript` | string | No | JavaScript code |
| `tests` | array | No | Test assertions |

## Folder Metadata

**File**: `folder.yaml` (in each folder)

```yaml
version: "1.0"

id: "auth-folder-001"
name: "Authentication"
description: "User authentication and authorization endpoints"

# Position in parent (collection root or parent folder)
order: 3

metadata:
  created: "2024-01-15T10:30:00Z"
  updated: "2024-11-29T16:15:00Z"
  tags:
    - "auth"
    - "security"

documentation: |
  # Authentication Endpoints
  
  These endpoints handle user authentication.

# Folder-level authentication (inherited by children)
auth:
  type: null

# Folder-level pre-request script
preRequestScript: |
  console.log("Executing authentication request...");

# Folder-level post-response script
postResponseScript: |
  if (request.url.includes("/login") && response.status === 200) {
    const data = response.json();
    env.set("accessToken", data.accessToken);
  }

# Folder-level tests
tests:
  - name: "Authentication endpoint responded"
    script: |
      assert(response.status !== 0, "Request completed");

# Variables specific to this folder
variables:
  authEndpoint: "{{baseUrl}}/auth"
  tokenExpiry: 3600
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Schema version ("1.0") |
| `id` | string | Yes | Unique identifier |
| `name` | string | Yes | Display name |
| `description` | string | No | Description |
| `order` | number | Yes | Position in parent |
| `metadata` | object | No | Additional metadata |
| `documentation` | string | No | Markdown documentation |
| `auth` | object | No | Folder-level auth |
| `preRequestScript` | string | No | JavaScript code |
| `postResponseScript` | string | No | JavaScript code |
| `tests` | array | No | Test assertions |
| `variables` | object | No | Folder variables |

## Request File

**File**: `*.request.yaml` (in collection root or folders)

```yaml
version: "1.0"

id: "login-request-001"
name: "Login User"
description: "Authenticate user with email and password"

# Position within parent
order: 1

metadata:
  created: "2024-01-15T10:30:00Z"
  updated: "2024-11-29T16:15:00Z"
  tags:
    - "auth"
    - "post"
  labels:
    priority: "high"
    status: "stable"

documentation: |
  # Login Endpoint
  
  Authenticates a user and returns tokens.

# Request configuration
request:
  method: "POST"                            # HTTP method
  url: "{{authEndpoint}}/login"            # URL with variables
  
  # Path variables (for URLs like /users/:userId)
  pathVariables:
    # userId: "123"
  
  # Query parameters
  queryParams:
    - key: "client_id"
      value: "web-app"
      enabled: true
      description: "Application identifier"
  
  # Headers
  headers:
    - key: "Content-Type"
      value: "application/json"
      enabled: true
      description: "Request content type"
    
    - key: "Accept"
      value: "application/json"
      enabled: true
    
    - key: "User-Agent"
      value: "Arcanine/1.0"
      enabled: true
  
  # Request body
  body:
    type: "json"                           # json, xml, formUrlEncoded, formData, graphql, text, binary, none
    
    # For JSON body
    content: |
      {
        "email": "{{testEmail}}",
        "password": "{{adminPassword}}"
      }

# Authentication (overrides folder/collection auth)
auth:
  type: null

# Pre-request script
preRequestScript: |
  const requestId = crypto.randomUUID();
  request.headers.set("X-Request-ID", requestId);
  
  const email = env.get("testEmail");
  if (!email || !email.includes("@")) {
    throw new Error("Invalid email format");
  }

# Post-response script
postResponseScript: |
  const data = response.json();
  
  if (response.status === 200 && data.accessToken) {
    env.set("accessToken", data.accessToken);
    env.set("refreshToken", data.refreshToken);
    env.set("userId", data.user.id);
    
    console.log("✓ Login successful");
  }

# Test scripts
tests:
  - name: "Status code is 200"
    script: |
      assert(response.status === 200, `Expected 200, got ${response.status}`);
  
  - name: "Response has access token"
    script: |
      const data = response.json();
      assert(data.accessToken, "Access token missing");

# Request settings (override collection settings)
settings:
  timeout: 5000
  followRedirects: false
  
  retry:
    enabled: false
    maxAttempts: 3
    delay: 1000
    onlyOnNetworkError: true
  
  cache:
    enabled: false
    ttl: 300
```

### Body Types

#### JSON Body
```yaml
body:
  type: "json"
  content: |
    {
      "key": "{{variable}}",
      "nested": {
        "value": 123
      }
    }
```

#### XML Body
```yaml
body:
  type: "xml"
  content: |
    <?xml version="1.0" encoding="UTF-8"?>
    <request>
      <email>{{email}}</email>
    </request>
```

#### Form URL Encoded
```yaml
body:
  type: "formUrlEncoded"
  formUrlEncoded:
    - key: "email"
      value: "{{testEmail}}"
      enabled: true
    - key: "password"
      value: "{{password}}"
      enabled: true
```

#### Multipart Form Data
```yaml
body:
  type: "formData"
  formData:
    fields:
      - key: "email"
        value: "{{testEmail}}"
        type: "text"
      - key: "age"
        value: "25"
        type: "text"
    files:
      - key: "avatar"
        filePath: "./test-image.jpg"
        mimeType: "image/jpeg"
```

#### GraphQL
```yaml
body:
  type: "graphql"
  graphql:
    query: |
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          email
        }
      }
    variables:
      id: "{{userId}}"
    operationName: "GetUser"
```

#### Text
```yaml
body:
  type: "text"
  content: "Plain text content"
```

#### Binary
```yaml
body:
  type: "binary"
  binary:
    filePath: "./file.pdf"
    mimeType: "application/pdf"
```

### Authentication Types

#### Bearer Token
```yaml
auth:
  type: "bearer"
  bearer:
    token: "{{accessToken}}"
    prefix: "Bearer"                        # Optional, defaults to "Bearer"
```

#### Basic Authentication
```yaml
auth:
  type: "basic"
  basic:
    username: "{{apiUsername}}"
    password: "{{apiPassword}}"
```

#### OAuth 2.0
```yaml
auth:
  type: "oauth2"
  oauth2:
    grantType: "authorizationCode"          # authorizationCode, clientCredentials, password, implicit
    authUrl: "{{baseUrl}}/oauth/authorize"
    tokenUrl: "{{baseUrl}}/oauth/token"
    clientId: "{{oauthClientId}}"
    clientSecret: "{{oauthClientSecret}}"
    scope: "read write"
    redirectUri: "http://localhost:3000/callback"
    usePKCE: true
```

#### API Key
```yaml
auth:
  type: "apiKey"
  apiKey:
    key: "X-API-Key"
    value: "{{apiKey}}"
    in: "header"                            # header or query
```

#### Digest Authentication
```yaml
auth:
  type: "digest"
  digest:
    username: "{{username}}"
    password: "{{password}}"
```

#### AWS Signature V4
```yaml
auth:
  type: "awsSigV4"
  awsSigV4:
    accessKey: "{{awsAccessKey}}"
    secretKey: "{{awsSecretKey}}"
    region: "us-east-1"
    service: "execute-api"
```

## Environment File

**File**: `environments/*.yaml`

```yaml
version: "1.0"

id: "dev-env-001"
name: "Development"
description: "Local development environment"

# Environment variables
variables:
  # Server configuration
  baseUrl: "http://localhost:3000"
  apiUrl: "{{baseUrl}}/api/{{apiVersion}}"
  wsUrl: "ws://localhost:3000"
  
  # Feature flags
  enableDebug: true
  enableMocks: false
  
  # Timeouts
  timeout: 10000
  retryAttempts: 3
  
  # Test data
  testUserId: "test-user-123"
  testEmail: "dev@example.com"
  
  # Database
  dbHost: "localhost"
  dbPort: 5432
  dbName: "myservice_dev"

# Reference to secrets file (relative path)
secretsFile: ".secrets/development.secrets.yaml"

# Environment-specific settings (override collection settings)
settings:
  timeout: 60000
  ssl:
    validateCertificates: false
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Schema version ("1.0") |
| `id` | string | Yes | Unique identifier |
| `name` | string | Yes | Display name |
| `description` | string | No | Description |
| `variables` | object | Yes | Environment variables |
| `secretsFile` | string | No | Path to secrets file |
| `settings` | object | No | Environment settings |

## Secrets File

**File**: `environments/.secrets/*.secrets.yaml` (gitignored)

```yaml
version: "1.0"

# Secret variables (never committed to git)
secrets:
  # Authentication
  adminPassword: "dev-secret-123"
  apiKey: "sk-dev-xxxxxxxxxxxxx"
  apiSecret: "secret-xxxxxxxxxxxxx"
  
  # OAuth credentials
  oauthClientId: "client-id-dev"
  oauthClientSecret: "client-secret-dev"
  
  # Database credentials
  dbUsername: "dev_user"
  dbPassword: "dev_pass_123"
  
  # Third-party services
  stripeSecretKey: "sk_test_xxxxxxxxxxxxx"
  sendgridApiKey: "SG.xxxxxxxxxxxxx"
  
  # JWT secrets
  jwtSecret: "jwt-secret-for-dev"
  refreshTokenSecret: "refresh-secret-for-dev"

# Encryption info (optional, for future encrypted secrets)
encryption:
  algorithm: null                           # e.g., "aes-256-gcm"
  keyDerivation: null                       # e.g., "pbkdf2"
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Schema version ("1.0") |
| `secrets` | object | Yes | Secret key-value pairs |
| `encryption` | object | No | Encryption configuration |

## Common Patterns

### Variable Interpolation

Variables can be referenced using `{{variableName}}` syntax:

```yaml
url: "{{baseUrl}}/api/{{apiVersion}}/users/{{userId}}"

headers:
  - key: "Authorization"
    value: "Bearer {{accessToken}}"
```

### Nested Variables

Variables can reference other variables:

```yaml
variables:
  baseUrl: "http://localhost:3000"
  apiUrl: "{{baseUrl}}/api"
  usersEndpoint: "{{apiUrl}}/users"
```

### Multi-line Strings

Use `|` for multi-line strings (preserves newlines):

```yaml
preRequestScript: |
  // Line 1
  // Line 2
  console.log("Multi-line script");
```

Use `>` for folded strings (replaces newlines with spaces):

```yaml
description: >
  This is a long description
  that will be folded into
  a single line.
```

### Conditional Execution

Use enabled flags to toggle headers, query params:

```yaml
headers:
  - key: "Debug"
    value: "true"
    enabled: false                          # Disabled, won't be sent
```

### Script Error Handling

```yaml
preRequestScript: |
  try {
    const token = env.get("accessToken");
    if (!token) {
      throw new Error("Not authenticated");
    }
  } catch (error) {
    console.error("Pre-request failed:", error.message);
    throw error;  // Stop request execution
  }
```

### Assertions

```yaml
tests:
  - name: "Status is 200"
    script: |
      assert(response.status === 200, `Expected 200, got ${response.status}`);
  
  - name: "Response has data"
    script: |
      const data = response.json();
      assert(data, "Response body is empty");
      assert(Array.isArray(data.items), "Items should be an array");
      assert(data.items.length > 0, "Items array is empty");
```

### WebSocket Request

```yaml
request:
  method: "WEBSOCKET"
  url: "{{wsUrl}}/chat"
  
  websocket:
    initialMessage: |
      {
        "type": "authenticate",
        "token": "{{accessToken}}"
      }
    
    protocol: null
    subprotocols: []
    autoReconnect: true
    reconnectDelay: 5000
    pingInterval: 30000
    
    messageTemplates:
      - name: "Send message"
        message: |
          {
            "type": "message",
            "text": "{{messageText}}"
          }
```

### gRPC Request

```yaml
request:
  method: "GRPC"
  url: "localhost:50051"
  
  grpc:
    protoFile: "../protos/user.proto"
    service: "UserService"
    method: "GetUser"
    
    message: |
      {
        "userId": "{{userId}}"
      }
    
    metadata:
      - key: "authorization"
        value: "Bearer {{accessToken}}"
    
    tls:
      enabled: false
      serverName: ""
      caCert: ""
      clientCert: ""
      clientKey: ""
    
    streamType: "unary"                     # unary, serverStream, clientStream, bidiStream
```

## Validation Rules

### Required Fields
- `version` must be "1.0"
- `id` must be a valid UUID
- `name` must not be empty
- `order` must be a positive integer

### Naming Conventions
- File names: `kebab-case.request.yaml`
- Variable names: `camelCase` or `snake_case`
- Folder names: `lowercase-with-hyphens`

### Best Practices
1. Always include `version` field
2. Use descriptive names and descriptions
3. Document complex requests with `documentation` field
4. Keep secrets in separate `.secrets.yaml` files
5. Use variable interpolation for reusability
6. Add assertions to verify responses
7. Use appropriate `order` values (multiples of 10 recommended)

---

For more information:
- [Architecture Overview](README.md)
- [Scripting Guide](scripting.md)
- [Authentication Guide](authentication.md)
