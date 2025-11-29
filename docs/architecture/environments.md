# Environment Management Guide

Complete guide to managing multiple environments in Arcanine.

## Table of Contents

- [Overview](#overview)
- [Environment Files](#environment-files)
- [Variables](#variables)
- [Secrets Management](#secrets-management)
- [Variable Resolution](#variable-resolution)
- [Environment Switching](#environment-switching)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

## Overview

Environments allow you to maintain different configurations for various deployment stages (development, staging, production) within the same collection.

### Key Features

- **Multiple Environments**: Create unlimited environment configurations
- **Variable Isolation**: Each environment has its own set of variables
- **Secrets Support**: Store sensitive data separately (gitignored)
- **Environment-Specific Settings**: Override collection settings per environment
- **Variable Interpolation**: Use `{{variableName}}` syntax throughout requests

## Environment Files

### Directory Structure

```
my-collection/
├── collection.yaml
└── environments/
    ├── development.yaml
    ├── staging.yaml
    ├── production.yaml
    ├── local-docker.yaml
    └── .secrets/                    # Gitignored
        ├── development.secrets.yaml
        ├── staging.secrets.yaml
        └── production.secrets.yaml
```

### Basic Environment File

```yaml
# environments/development.yaml
version: '1.0'

id: 'dev-env-001'
name: 'Development'
description: 'Local development environment'

variables:
  baseUrl: 'http://localhost:3000'
  apiUrl: '{{baseUrl}}/api'
  timeout: 30000
  debugMode: true

secretsFile: '.secrets/development.secrets.yaml'
```

### Secrets File

```yaml
# environments/.secrets/development.secrets.yaml
version: '1.0'

secrets:
  apiKey: 'sk_dev_xxxxxxxxxxxxx'
  apiSecret: 'secret_dev_xxxxxxxxxxxxx'
  dbPassword: 'dev_password_123'
  jwtSecret: 'jwt_secret_for_dev'
```

## Variables

### Types of Variables

1. **Environment Variables** - Defined in `environment.yaml`
2. **Collection Variables** - Defined in `collection.yaml`
3. **Folder Variables** - Defined in `folder.yaml`
4. **Global Variables** - Application-level settings
5. **Secret Variables** - Defined in `.secrets.yaml` (gitignored)

### Variable Syntax

Use double curly braces for variable interpolation:

```yaml
url: '{{baseUrl}}/users/{{userId}}'
headers:
  - key: 'Authorization'
    value: 'Bearer {{accessToken}}'
```

### Defining Variables

```yaml
# Simple variables
variables:
  baseUrl: "https://api.example.com"
  apiVersion: "v1"
  timeout: 5000

# Nested variable references
variables:
  baseUrl: "https://api.example.com"
  apiUrl: "{{baseUrl}}/api/{{apiVersion}}"
  usersEndpoint: "{{apiUrl}}/users"

# Boolean and numeric values
variables:
  enableDebug: true
  retryAttempts: 3
  timeout: 30000
```

### Using Variables

```yaml
# In URLs
request:
  url: '{{baseUrl}}/users/{{userId}}'

# In headers
headers:
  - key: 'X-API-Key'
    value: '{{apiKey}}'

# In body
body:
  type: 'json'
  content: |
    {
      "email": "{{userEmail}}",
      "apiKey": "{{apiKey}}"
    }

# In scripts
preRequestScript: |
  const baseUrl = env.get("baseUrl");
  console.log(`Base URL: ${baseUrl}`);
```

## Secrets Management

### Why Separate Secrets?

- Keep sensitive data out of version control
- Share collections without exposing credentials
- Different secrets per environment
- Team members can have their own secrets

### Creating Secrets File

```yaml
# environments/.secrets/production.secrets.yaml
version: '1.0'

secrets:
  # API Keys
  apiKey: 'sk_live_xxxxxxxxxxxxx'
  apiSecret: 'secret_live_xxxxxxxxxxxxx'

  # Database
  dbHost: 'prod-db.example.com'
  dbUsername: 'prod_user'
  dbPassword: 'super_secret_password'

  # OAuth
  oauthClientId: 'prod-client-id'
  oauthClientSecret: 'prod-client-secret'

  # JWT
  jwtSecret: 'jwt-prod-secret-key'
  refreshTokenSecret: 'refresh-prod-secret'

  # Third-party Services
  stripeSecretKey: 'sk_live_xxxxxxxxxxxxx'
  sendgridApiKey: 'SG.xxxxxxxxxxxxx'
  awsAccessKey: 'AKIAXXXXXXXXXXXXX'
  awsSecretKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
```

### .gitignore Configuration

```gitignore
# In collection root .gitignore

# Secrets
environments/.secrets/
*.secrets.yaml
.env.secrets

# Local settings
*.local.yaml
.local/

# OS files
.DS_Store
Thumbs.db
```

### Secrets Template

Create a template for team members:

```yaml
# environments/.secrets/template.secrets.yaml (committed)
version: '1.0'

secrets:
  # API Keys (get from https://dashboard.example.com/api-keys)
  apiKey: 'YOUR_API_KEY_HERE'
  apiSecret: 'YOUR_API_SECRET_HERE'

  # Database (contact DevOps for credentials)
  dbUsername: 'YOUR_DB_USERNAME'
  dbPassword: 'YOUR_DB_PASSWORD'

  # OAuth (register app at https://oauth.example.com)
  oauthClientId: 'YOUR_CLIENT_ID'
  oauthClientSecret: 'YOUR_CLIENT_SECRET'
```

## Variable Resolution

### Resolution Order

When resolving `{{variableName}}`, Arcanine searches in this order:

1. **Collection Variables** (`collection.yaml`)
2. **Environment Variables** (`environment.yaml`)
3. **Global Variables** (application settings)
4. **Secrets** (`.secrets.yaml`)

### Example Resolution

```yaml
# collection.yaml
variables:
  apiVersion: "v1"
  defaultTimeout: 5000

# environments/development.yaml
variables:
  baseUrl: "http://localhost:3000"
  apiUrl: "{{baseUrl}}/api/{{apiVersion}}"  # Uses collection's apiVersion
  timeout: 10000  # Overrides collection's defaultTimeout

secrets:
  apiKey: "sk_dev_xxxxxxxxxxxxx"

# In request:
url: "{{apiUrl}}/users"  # Resolves to: http://localhost:3000/api/v1/users
headers:
  - key: "X-API-Key"
    value: "{{apiKey}}"  # Resolves from secrets
```

### Runtime Variables

Variables can be set dynamically during execution:

```yaml
postResponseScript: |
  // Set variable from response
  const data = response.json();
  env.set("accessToken", data.token);
  env.set("userId", data.user.id);

# Next request can use these:
request:
  url: '{{baseUrl}}/users/{{userId}}'
  headers:
    - key: 'Authorization'
      value: 'Bearer {{accessToken}}'
```

## Environment Switching

### In UI

1. Select environment from dropdown
2. All requests use selected environment's variables
3. Switch anytime without restarting

### Environment-Specific Settings

Override collection settings per environment:

```yaml
# environments/development.yaml
variables:
  baseUrl: "http://localhost:3000"

settings:
  timeout: 60000  # Longer timeout for debugging
  ssl:
    validateCertificates: false  # Allow self-signed certs

# environments/production.yaml
variables:
  baseUrl: "https://api.example.com"

settings:
  timeout: 10000  # Shorter timeout
  ssl:
    validateCertificates: true  # Strict validation
  proxy:
    enabled: true
    url: "http://proxy.company.com:8080"
```

## Best Practices

### 1. Use Descriptive Names

```yaml
# Good
variables:
  baseUrl: "https://api.example.com"
  apiVersion: "v1"
  userEmail: "test@example.com"

# Avoid
variables:
  url: "https://api.example.com"
  v: "v1"
  email: "test@example.com"
```

### 2. Group Related Variables

```yaml
variables:
  # Server Configuration
  baseUrl: 'https://api.example.com'
  apiUrl: '{{baseUrl}}/api/{{apiVersion}}'
  wsUrl: 'wss://api.example.com'

  # Timeouts
  defaultTimeout: 5000
  longTimeout: 30000

  # Feature Flags
  enableDebug: true
  enableMocks: false

  # Test Data
  testUserId: 'user-123'
  testEmail: 'test@example.com'
```

### 3. Document Variables

```yaml
name: 'Development'
description: |
  Local development environment

  ## Required Secrets
  - apiKey: Get from https://dashboard.example.com
  - dbPassword: Use local database password

  ## Configuration
  - Base URL points to localhost:3000
  - SSL validation disabled for self-signed certs
  - Debug mode enabled

variables:
  baseUrl: 'http://localhost:3000'
```

### 4. Use Consistent Naming

```yaml
# Good (consistent across environments)
# development.yaml
variables:
  baseUrl: "http://localhost:3000"
  apiKey: "{{apiKey}}"

# production.yaml
variables:
  baseUrl: "https://api.example.com"
  apiKey: "{{apiKey}}"

# Avoid (inconsistent names)
# development.yaml
variables:
  devUrl: "http://localhost:3000"
  devKey: "{{apiKey}}"

# production.yaml
variables:
  prodUrl: "https://api.example.com"
  prodApiKey: "{{apiKey}}"
```

### 5. Never Commit Secrets

```yaml
# ❌ BAD - secrets in environment.yaml (committed)
variables:
  apiKey: "sk_live_xxxxxxxxxxxxx"
  password: "mypassword123"

# ✅ GOOD - reference from secrets file
variables:
  baseUrl: "https://api.example.com"

secretsFile: ".secrets/production.secrets.yaml"

# ✅ GOOD - secrets in gitignored file
# .secrets/production.secrets.yaml
secrets:
  apiKey: "sk_live_xxxxxxxxxxxxx"
  password: "mypassword123"
```

### 6. Provide Templates

```yaml
# .secrets/template.secrets.yaml (committed)
version: '1.0'

secrets:
  # Instructions for getting values
  apiKey: 'GET_FROM_DASHBOARD'
  dbPassword: 'ASK_DEVOPS_TEAM'
  oauthClientSecret: 'REGISTER_APP_FIRST'
```

### 7. Validate Required Variables

```yaml
# In critical requests
preRequestScript: |
  const required = ["apiKey", "baseUrl", "accessToken"];

  for (const varName of required) {
    if (!env.get(varName)) {
      throw new Error(`Missing required variable: ${varName}`);
    }
  }

  console.log("✓ All required variables present");
```

## Common Patterns

### Pattern 1: Multi-Stage Deployment

```yaml
# environments/development.yaml
variables:
  baseUrl: "http://localhost:3000"
  environment: "development"
  logLevel: "debug"

# environments/staging.yaml
variables:
  baseUrl: "https://staging-api.example.com"
  environment: "staging"
  logLevel: "info"

# environments/production.yaml
variables:
  baseUrl: "https://api.example.com"
  environment: "production"
  logLevel: "error"
```

### Pattern 2: Feature Flags

```yaml
variables:
  # Feature flags
  enableNewUI: true
  enableBetaFeatures: false
  enableAnalytics: true
  enableDebugMode: false

# In requests
preRequestScript: |
  if (env.get("enableDebugMode") === "true") {
    console.log("Debug mode enabled");
    request.headers.set("X-Debug", "true");
  }
```

### Pattern 3: Dynamic Base URLs

```yaml
variables:
  # Environment-specific URLs
  authUrl: 'https://auth.example.com'
  apiUrl: 'https://api.example.com'
  wsUrl: 'wss://ws.example.com'

  # Composed URLs
  loginEndpoint: '{{authUrl}}/login'
  usersEndpoint: '{{apiUrl}}/users'
  chatEndpoint: '{{wsUrl}}/chat'
```

### Pattern 4: Database Configurations

```yaml
# environments/development.yaml
variables:
  dbHost: "localhost"
  dbPort: 5432
  dbName: "myapp_dev"

secrets:
  dbUsername: "dev_user"
  dbPassword: "dev_password"

# environments/production.yaml
variables:
  dbHost: "prod-db.example.com"
  dbPort: 5432
  dbName: "myapp_prod"

secrets:
  dbUsername: "prod_user"
  dbPassword: "super_secret_prod_password"
```

### Pattern 5: Environment-Specific Test Data

```yaml
# environments/development.yaml
variables:
  testUserId: "test-user-123"
  testEmail: "dev@example.com"
  testProductId: "prod-456"

# environments/staging.yaml
variables:
  testUserId: "staging-user-789"
  testEmail: "staging@example.com"
  testProductId: "prod-789"

# Use in requests
body:
  content: |
    {
      "userId": "{{testUserId}}",
      "email": "{{testEmail}}"
    }
```

### Pattern 6: Authentication Per Environment

```yaml
# environments/development.yaml
auth:
  type: "basic"
  basic:
    username: "admin"
    password: "{{devPassword}}"

# environments/production.yaml
auth:
  type: "oauth2"
  oauth2:
    grantType: "clientCredentials"
    tokenUrl: "{{authUrl}}/token"
    clientId: "{{oauthClientId}}"
    clientSecret: "{{oauthClientSecret}}"
```

### Pattern 7: Timeout Strategy

```yaml
# environments/development.yaml
settings:
  timeout: 60000  # 60 seconds for debugging

# environments/staging.yaml
settings:
  timeout: 15000  # 15 seconds

# environments/production.yaml
settings:
  timeout: 5000   # 5 seconds (strict)
```

## Environment Comparison

### Development

```yaml
name: 'Development'
variables:
  baseUrl: 'http://localhost:3000'
  enableDebug: true
  logLevel: 'debug'

settings:
  timeout: 60000
  ssl:
    validateCertificates: false
```

**Use for:**

- Local development
- Debugging
- Testing new features

### Staging

```yaml
name: 'Staging'
variables:
  baseUrl: 'https://staging-api.example.com'
  enableDebug: false
  logLevel: 'info'

settings:
  timeout: 15000
  ssl:
    validateCertificates: true
```

**Use for:**

- Pre-production testing
- QA validation
- Integration testing

### Production

```yaml
name: 'Production'
variables:
  baseUrl: 'https://api.example.com'
  enableDebug: false
  logLevel: 'error'

settings:
  timeout: 5000
  ssl:
    validateCertificates: true
  proxy:
    enabled: true
```

**Use for:**

- Live API calls
- Production debugging
- Monitoring

## Troubleshooting

### Variable Not Resolving

```yaml
# Check resolution order
preRequestScript: |
  const varName = "baseUrl";
  const value = env.get(varName);

  if (!value) {
    console.error(`Variable ${varName} not found`);
    console.log("Available variables:", Object.keys(env));
  } else {
    console.log(`${varName} = ${value}`);
  }
```

### Missing Secrets

```yaml
preRequestScript: |
  const secrets = ["apiKey", "apiSecret"];
  const missing = secrets.filter(s => !env.get(s));

  if (missing.length > 0) {
    throw new Error(`Missing secrets: ${missing.join(", ")}`);
  }
```

### Environment Debugging

```yaml
preRequestScript: |
  console.log("Current Environment:");
  console.log("  Base URL:", env.get("baseUrl"));
  console.log("  API Version:", env.get("apiVersion"));
  console.log("  Debug Mode:", env.get("enableDebug"));
  console.log("  Environment:", env.get("environment"));
```

---

For more information:

- [Architecture Overview](README.md)
- [YAML Schema Reference](yaml-schema.md)
- [Collection Structure](collection-structure.md)
- [Scripting Guide](scripting.md)
