# Authentication Guide

Complete guide to all authentication methods supported in Arcanine.

## Table of Contents

- [Overview](#overview)
- [Authentication Types](#authentication-types)
- [Bearer Token](#bearer-token)
- [Basic Authentication](#basic-authentication)
- [OAuth 2.0](#oauth-20)
- [API Key](#api-key)
- [Digest Authentication](#digest-authentication)
- [AWS Signature V4](#aws-signature-v4)
- [Authentication Inheritance](#authentication-inheritance)
- [Best Practices](#best-practices)

## Overview

Arcanine supports six authentication methods, each designed for different use cases:

| Type | Use Case | Security Level |
|------|----------|----------------|
| Bearer Token | Modern APIs, JWT | High |
| Basic Auth | Simple APIs, legacy systems | Medium |
| OAuth 2.0 | Third-party APIs, delegated access | Very High |
| API Key | Simple APIs, rate limiting | Medium |
| Digest Auth | Legacy systems requiring better security than Basic | High |
| AWS Signature V4 | AWS services | Very High |

### Authentication Hierarchy

```mermaid
%%{init: {'theme':'neutral'}}%%
classDiagram
    class Collection {
        +auth: AuthConfig
        +applies to all requests
    }
    class Folder {
        +auth: AuthConfig
        +overrides collection auth
        +applies to folder requests
    }
    class Request {
        +auth: AuthConfig
        +overrides folder & collection
        +applies to single request
    }
    
    Collection <|-- Folder : inherits from
    Folder <|-- Request : inherits from
    
    note for Collection "Base authentication\nfor entire collection"
    note for Folder "Override for\nfolder requests"
    note for Request "Override for\nspecific request"
```

Authentication can be configured at three levels:

1. **Collection Level** - Applies to all requests in the collection
2. **Folder Level** - Applies to all requests in the folder (overrides collection)
3. **Request Level** - Applies only to that request (overrides folder and collection)

## Authentication Types

### Configuring Authentication

Authentication is configured in the `auth` section of YAML files:

```yaml
auth:
  type: "bearer"  # Authentication type
  bearer:         # Type-specific configuration
    token: "{{accessToken}}"
    prefix: "Bearer"
```

## Bearer Token

Bearer token authentication sends a token in the `Authorization` header. Commonly used with JWT (JSON Web Tokens).

### Configuration

```yaml
auth:
  type: "bearer"
  bearer:
    token: "{{accessToken}}"
    prefix: "Bearer"  # Optional, defaults to "Bearer"
```

### Result

Adds header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example: JWT Authentication

```yaml
# Login request to get token
name: "Login"
request:
  method: "POST"
  url: "{{baseUrl}}/auth/login"
  body:
    type: "json"
    content: |
      {
        "email": "{{userEmail}}",
        "password": "{{userPassword}}"
      }

auth:
  type: null  # No auth for login

postResponseScript: |
  const data = response.json();
  if (data.token) {
    env.set("accessToken", data.token);
    console.log("✓ Token saved");
  }

---

# Authenticated request using token
name: "Get Profile"
request:
  method: "GET"
  url: "{{baseUrl}}/user/profile"

auth:
  type: "bearer"
  bearer:
    token: "{{accessToken}}"
```

### Custom Prefix

Some APIs use custom prefixes:

```yaml
auth:
  type: "bearer"
  bearer:
    token: "{{apiToken}}"
    prefix: "Token"  # Results in: Authorization: Token abc123
```

## Basic Authentication

Basic authentication encodes username and password in Base64 and sends in the `Authorization` header.

### Configuration

```yaml
auth:
  type: "basic"
  basic:
    username: "{{apiUsername}}"
    password: "{{apiPassword}}"
```

### Result

Adds header:
```
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

The value is Base64 encoded `username:password`.

### Example: API with Basic Auth

```yaml
name: "Get Users"
request:
  method: "GET"
  url: "{{baseUrl}}/api/users"

auth:
  type: "basic"
  basic:
    username: "admin"
    password: "{{adminPassword}}"
```

### Security Considerations

- Always use HTTPS with Basic Auth
- Store passwords in secrets files (`.secrets.yaml`)
- Consider using API keys or tokens for production

```yaml
# In environment.yaml
variables:
  apiUsername: "admin"

# In .secrets/environment.secrets.yaml
secrets:
  adminPassword: "super-secret-password"
```

## OAuth 2.0

OAuth 2.0 is a comprehensive authorization framework supporting multiple grant types.

### Grant Types

1. **Authorization Code** - Most secure, requires user interaction
2. **Authorization Code with PKCE** - Enhanced security for public clients
3. **Client Credentials** - Server-to-server authentication
4. **Password** - Direct username/password exchange (discouraged)
5. **Implicit** - Deprecated, not recommended

### Authorization Code Flow (with PKCE)

```yaml
auth:
  type: "oauth2"
  oauth2:
    grantType: "authorizationCode"
    authUrl: "{{baseUrl}}/oauth/authorize"
    tokenUrl: "{{baseUrl}}/oauth/token"
    clientId: "{{oauthClientId}}"
    clientSecret: "{{oauthClientSecret}}"
    scope: "read write"
    redirectUri: "http://localhost:3000/callback"
    usePKCE: true  # Recommended for security
```

### Client Credentials Flow

For server-to-server authentication:

```yaml
auth:
  type: "oauth2"
  oauth2:
    grantType: "clientCredentials"
    tokenUrl: "{{baseUrl}}/oauth/token"
    clientId: "{{oauthClientId}}"
    clientSecret: "{{oauthClientSecret}}"
    scope: "api.read api.write"
```

### Password Flow

Direct username/password exchange (use with caution):

```yaml
auth:
  type: "oauth2"
  oauth2:
    grantType: "password"
    tokenUrl: "{{baseUrl}}/oauth/token"
    clientId: "{{oauthClientId}}"
    clientSecret: "{{oauthClientSecret}}"
    username: "{{userEmail}}"
    password: "{{userPassword}}"
    scope: "read write"
```

### OAuth 2.0 Complete Example

```yaml
# Collection-level OAuth configuration
auth:
  type: "oauth2"
  oauth2:
    grantType: "authorizationCode"
    authUrl: "https://accounts.example.com/oauth/authorize"
    tokenUrl: "https://accounts.example.com/oauth/token"
    clientId: "{{oauthClientId}}"
    clientSecret: "{{oauthClientSecret}}"
    scope: "user:read user:write"
    redirectUri: "http://localhost:3000/callback"
    usePKCE: true

# In .secrets/environment.secrets.yaml
secrets:
  oauthClientId: "client-id-here"
  oauthClientSecret: "client-secret-here"
```

### Token Refresh

Handle token refresh in scripts:

```yaml
postResponseScript: |
  if (response.status === 401) {
    console.log("Token expired, need to refresh");
    // Trigger re-authentication flow
  }
```

## API Key

API Key authentication sends a key either in a header or query parameter.

### Header-based API Key

```yaml
auth:
  type: "apiKey"
  apiKey:
    key: "X-API-Key"
    value: "{{apiKey}}"
    in: "header"
```

Result:
```
X-API-Key: sk_live_xxxxxxxxxxxxx
```

### Query Parameter API Key

```yaml
auth:
  type: "apiKey"
  apiKey:
    key: "api_key"
    value: "{{apiKey}}"
    in: "query"
```

Result:
```
https://api.example.com/users?api_key=sk_live_xxxxxxxxxxxxx
```

### Example: Multiple API Keys

Some services require multiple keys:

```yaml
name: "Get Data"
request:
  method: "GET"
  url: "{{baseUrl}}/data"
  
  # Primary API key via auth
  auth:
    type: "apiKey"
    apiKey:
      key: "X-API-Key"
      value: "{{primaryApiKey}}"
      in: "header"
  
  # Secondary key as custom header
  headers:
    - key: "X-App-Id"
      value: "{{appId}}"
      enabled: true
```

### Common API Key Headers

- `X-API-Key`
- `Authorization` (with custom prefix like "ApiKey")
- `X-Auth-Token`
- `X-Application-Key`

## Digest Authentication

Digest authentication is more secure than Basic auth, using MD5 hashing with a challenge-response mechanism.

### Configuration

```yaml
auth:
  type: "digest"
  digest:
    username: "{{username}}"
    password: "{{password}}"
```

### How It Works

1. Client sends request without credentials
2. Server responds with 401 and challenge (nonce, realm, etc.)
3. Client computes hash using credentials and challenge
4. Client resends request with computed hash
5. Server verifies and grants access

Arcanine handles this flow automatically.

### Example

```yaml
name: "Access Protected Resource"
request:
  method: "GET"
  url: "{{baseUrl}}/protected/data"

auth:
  type: "digest"
  digest:
    username: "admin"
    password: "{{adminPassword}}"
```

### Security Notes

- More secure than Basic auth (password not sent in clear text)
- Still vulnerable to MITM attacks without HTTPS
- Use HTTPS in production
- MD5 is considered weak, modern systems prefer other methods

## AWS Signature V4

AWS Signature Version 4 is required for AWS service authentication.

### Configuration

```yaml
auth:
  type: "awsSigV4"
  awsSigV4:
    accessKey: "{{awsAccessKey}}"
    secretKey: "{{awsSecretKey}}"
    region: "us-east-1"
    service: "execute-api"  # Service name (e.g., s3, dynamodb, execute-api)
```

### Example: AWS API Gateway

```yaml
name: "Invoke Lambda via API Gateway"
request:
  method: "POST"
  url: "https://abc123.execute-api.us-east-1.amazonaws.com/prod/function"
  body:
    type: "json"
    content: |
      {
        "action": "process",
        "data": "example"
      }

auth:
  type: "awsSigV4"
  awsSigV4:
    accessKey: "{{awsAccessKey}}"
    secretKey: "{{awsSecretKey}}"
    region: "us-east-1"
    service: "execute-api"
```

### Example: S3 Object Access

```yaml
name: "Get S3 Object"
request:
  method: "GET"
  url: "https://my-bucket.s3.us-west-2.amazonaws.com/path/to/object.json"

auth:
  type: "awsSigV4"
  awsSigV4:
    accessKey: "{{awsAccessKey}}"
    secretKey: "{{awsSecretKey}}"
    region: "us-west-2"
    service: "s3"
```

### AWS Services

Common service names:
- `s3` - S3 storage
- `dynamodb` - DynamoDB database
- `execute-api` - API Gateway
- `lambda` - Lambda functions
- `sns` - SNS notifications
- `sqs` - SQS queues

### Session Tokens

For temporary credentials:

```yaml
auth:
  type: "awsSigV4"
  awsSigV4:
    accessKey: "{{awsAccessKey}}"
    secretKey: "{{awsSecretKey}}"
    sessionToken: "{{awsSessionToken}}"  # Optional
    region: "us-east-1"
    service: "execute-api"
```

## Authentication Inheritance

Authentication cascades from collection → folder → request level.

### Example Hierarchy

```yaml
# collection.yaml (applies to all requests)
auth:
  type: "bearer"
  bearer:
    token: "{{defaultToken}}"

---

# authentication/folder.yaml (overrides for auth folder)
auth:
  type: null  # No auth for auth endpoints

---

# users/folder.yaml (inherits from collection)
# No auth specified, uses collection-level bearer token

---

# admin/folder.yaml (different auth for admin)
auth:
  type: "basic"
  basic:
    username: "admin"
    password: "{{adminPassword}}"

---

# users/public-profile.request.yaml (override to no auth)
auth:
  type: null  # Public endpoint, no auth needed
```

### Inheritance Rules

```mermaid
%%{init: {'theme':'neutral'}}%%
flowchart TD
    Start([Check Authentication]) --> HasRequest{Request has<br/>auth config?}
    HasRequest -->|Yes| UseRequest[Use Request Auth]
    HasRequest -->|No| HasFolder{Folder has<br/>auth config?}
    HasFolder -->|Yes| UseFolder[Use Folder Auth]
    HasFolder -->|No| HasCollection{Collection has<br/>auth config?}
    HasCollection -->|Yes| UseCollection[Use Collection Auth]
    HasCollection -->|No| NoAuth[No Authentication]
    
    UseRequest --> End([Apply Authentication])
    UseFolder --> End
    UseCollection --> End
    NoAuth --> End
```

1. If request has `auth`, use request auth
2. Else if folder has `auth`, use folder auth
3. Else if collection has `auth`, use collection auth
4. Else no authentication

### Disabling Authentication

To disable inherited authentication:

```yaml
auth:
  type: null
```

## Best Practices

### 1. Store Secrets Securely

```yaml
# ❌ Bad: Secrets in environment.yaml (committed to git)
variables:
  apiKey: "sk_live_xxxxxxxxxxxxx"
  password: "mypassword123"

# ✅ Good: Secrets in .secrets.yaml (gitignored)
# environment.yaml
variables:
  baseUrl: "https://api.example.com"

# .secrets/environment.secrets.yaml
secrets:
  apiKey: "sk_live_xxxxxxxxxxxxx"
  password: "mypassword123"
```

### 2. Use Environment Variables

```yaml
# ✅ Good: Reference environment variables
auth:
  type: "bearer"
  bearer:
    token: "{{accessToken}}"

# ❌ Bad: Hardcode tokens
auth:
  type: "bearer"
  bearer:
    token: "hardcoded-token-value"
```

### 3. Choose Appropriate Auth Type

```yaml
# Modern API - Use Bearer Token
auth:
  type: "bearer"
  bearer:
    token: "{{jwtToken}}"

# Third-party API - Use OAuth 2.0
auth:
  type: "oauth2"
  oauth2:
    grantType: "authorizationCode"
    # ...

# Legacy system - Use Basic or Digest
auth:
  type: "digest"  # More secure than basic
  digest:
    username: "{{username}}"
    password: "{{password}}"
```

### 4. Handle Token Expiry

```yaml
postResponseScript: |
  if (response.status === 401) {
    const data = response.json();
    
    if (data.error === "token_expired") {
      console.log("⚠ Token expired, re-authenticate required");
      env.delete("accessToken");
    }
  }
```

### 5. Use HTTPS

Always use HTTPS when sending credentials:

```yaml
# ✅ Good
url: "https://api.example.com/login"

# ❌ Bad (credentials sent in plain text)
url: "http://api.example.com/login"
```

### 6. Rotate API Keys

Implement key rotation:

```yaml
postResponseScript: |
  // Check if key is expiring soon
  const keyExpiry = env.get("apiKeyExpiry");
  if (keyExpiry) {
    const expiryDate = new Date(keyExpiry);
    const now = new Date();
    const daysUntilExpiry = (expiryDate - now) / (1000 * 60 * 60 * 24);
    
    if (daysUntilExpiry < 7) {
      console.warn(`⚠ API key expires in ${Math.floor(daysUntilExpiry)} days`);
    }
  }
```

### 7. Document Authentication Requirements

```yaml
documentation: |
  # Authentication
  
  This API requires Bearer token authentication.
  
  ## Getting a Token
  1. Call POST /auth/login with credentials
  2. Extract `accessToken` from response
  3. Use token in subsequent requests
  
  ## Token Expiry
  Tokens expire after 1 hour. Refresh using POST /auth/refresh

auth:
  type: "bearer"
  bearer:
    token: "{{accessToken}}"
```

### 8. Test Authentication Flows

```yaml
tests:
  - name: "Authenticated successfully"
    script: |
      assert(response.status === 200, "Authentication failed");
  
  - name: "Has authorization header"
    script: |
      const authHeader = request.headers.get("Authorization");
      assert(authHeader, "Missing Authorization header");
      assert(authHeader.startsWith("Bearer "), "Invalid auth format");
```

## Common Authentication Patterns

### Pattern 1: Login and Use Token

```yaml
# 1. Login
name: "Login"
auth:
  type: null

postResponseScript: |
  const data = response.json();
  env.set("accessToken", data.accessToken);

---

# 2. Use token in subsequent requests
name: "Get Data"
auth:
  type: "bearer"
  bearer:
    token: "{{accessToken}}"
```

### Pattern 2: Token Refresh

```yaml
name: "Refresh Token"
request:
  method: "POST"
  url: "{{baseUrl}}/auth/refresh"
  body:
    type: "json"
    content: |
      {
        "refreshToken": "{{refreshToken}}"
      }

postResponseScript: |
  const data = response.json();
  env.set("accessToken", data.accessToken);
  console.log("✓ Token refreshed");
```

### Pattern 3: Conditional Authentication

```yaml
preRequestScript: |
  // Check if token exists, skip auth if not
  const token = env.get("accessToken");
  if (!token) {
    console.warn("⚠ No token found, request may fail");
  }

auth:
  type: "bearer"
  bearer:
    token: "{{accessToken}}"
```

---

For more information:
- [Architecture Overview](README.md)
- [YAML Schema Reference](yaml-schema.md)
- [Scripting Guide](scripting.md)
