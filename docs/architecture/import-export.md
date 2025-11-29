# Import/Export Guide

Complete guide to importing and exporting collections in Arcanine.

## Table of Contents

- [Overview](#overview)
- [Supported Formats](#supported-formats)
- [Importing Collections](#importing-collections)
- [Exporting Collections](#exporting-collections)
- [Format Conversion](#format-conversion)
- [Migration Strategies](#migration-strategies)
- [Troubleshooting](#troubleshooting)

## Overview

Arcanine supports importing and exporting collections from/to various formats, making it easy to migrate from other REST clients or share collections across different tools.

### Key Features

- Import from Postman, Insomnia, and OpenAPI
- Export to multiple formats
- Preserve request organization
- Convert authentication methods
- Maintain environment variables
- Support for scripts and tests

## Supported Formats

### Import Formats

| Format             | Version    | Status          | Notes                         |
| ------------------ | ---------- | --------------- | ----------------------------- |
| Postman Collection | v2.0, v2.1 | ✅ Full Support | Includes scripts, tests, auth |
| Insomnia Workspace | v4         | ✅ Full Support | Includes environments         |
| OpenAPI/Swagger    | 3.0, 3.1   | ✅ Full Support | Generates requests from spec  |
| HAR (HTTP Archive) | 1.2        | ⚠️ Partial      | No authentication             |
| cURL Commands      | -          | ✅ Full Support | Single request import         |
| Arcanine YAML      | 1.0        | ✅ Native       | Full fidelity                 |

### Export Formats

| Format                  | Status          | Notes                    |
| ----------------------- | --------------- | ------------------------ |
| Arcanine YAML           | ✅ Full Support | Native format            |
| Postman Collection v2.1 | ✅ Full Support | For Postman users        |
| Insomnia v4             | ✅ Full Support | For Insomnia users       |
| OpenAPI 3.1             | ⚠️ Partial      | Limited to HTTP requests |
| cURL Commands           | ✅ Full Support | Per-request export       |
| Markdown Documentation  | ✅ Full Support | Human-readable docs      |

## Importing Collections

### From Postman

#### Command Line

```bash
# Import Postman collection
arcanine import postman \
  --file ./postman_collection.json \
  --output ./my-collection

# Import with environment
arcanine import postman \
  --file ./postman_collection.json \
  --environment ./postman_environment.json \
  --output ./my-collection
```

#### Via GUI

1. File → Import → Postman Collection
2. Select `.json` file
3. Choose target directory
4. Review and confirm

#### Postman Format Mapping

| Postman            | Arcanine           | Notes                         |
| ------------------ | ------------------ | ----------------------------- |
| Collection         | Collection         | Mapped to `collection.yaml`   |
| Folder             | Folder             | Creates `folder.yaml`         |
| Request            | Request            | Creates `.request.yaml`       |
| Environment        | Environment        | Creates `environments/*.yaml` |
| Pre-request Script | Pre-request Script | Converted to Deno             |
| Test Script        | Test               | Converted to assertions       |
| Variables          | Variables          | Preserved                     |

#### Example Conversion

**Postman:**

```json
{
  "info": {
    "name": "My API",
    "description": "API Collection"
  },
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/auth/login",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"{{email}}\",\"password\":\"{{password}}\"}"
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test(\"Status is 200\", function() {",
              "  pm.response.to.have.status(200);",
              "});"
            ]
          }
        }
      ]
    }
  ]
}
```

**Arcanine:**

```yaml
# collection.yaml
version: "1.0"
name: "My API"
description: "API Collection"

# login.request.yaml
version: "1.0"
name: "Login"
order: 1

request:
  method: "POST"
  url: "{{baseUrl}}/auth/login"
  headers:
    - key: "Content-Type"
      value: "application/json"
      enabled: true
  body:
    type: "json"
    content: |
      {
        "email": "{{email}}",
        "password": "{{password}}"
      }

tests:
  - name: "Status is 200"
    script: |
      assert(response.status === 200, "Expected status 200");
```

### From Insomnia

#### Command Line

```bash
# Import Insomnia workspace
arcanine import insomnia \
  --file ./insomnia_workspace.json \
  --output ./my-collection
```

#### Via GUI

1. File → Import → Insomnia Workspace
2. Select workspace JSON file
3. Choose target directory
4. Review and confirm

#### Insomnia Format Mapping

| Insomnia         | Arcanine             | Notes                  |
| ---------------- | -------------------- | ---------------------- |
| Workspace        | Collection           | Root collection        |
| Folder           | Folder               | Hierarchical structure |
| Request          | Request              | Full conversion        |
| Environment      | Environment          | Multiple environments  |
| Base Environment | Collection Variables | Global vars            |

### From OpenAPI

#### Command Line

```bash
# Import OpenAPI specification
arcanine import openapi \
  --file ./openapi.yaml \
  --output ./my-collection \
  --server development

# Generate with examples
arcanine import openapi \
  --file ./openapi.yaml \
  --output ./my-collection \
  --include-examples \
  --auth bearer
```

#### Via GUI

1. File → Import → OpenAPI Specification
2. Select YAML or JSON file
3. Choose server (if multiple defined)
4. Configure import options
5. Review and confirm

#### OpenAPI Import Options

```bash
# Server selection
--server development|staging|production

# Include examples from spec
--include-examples

# Set default authentication
--auth none|bearer|basic|apiKey

# Generate test assertions
--generate-tests

# Create folder per tag
--group-by-tags
```

#### Example OpenAPI Import

**OpenAPI:**

```yaml
openapi: 3.1.0
info:
  title: User API
  version: 1.0.0
servers:
  - url: https://api.example.com
    description: Production
  - url: http://localhost:3000
    description: Development
paths:
  /users:
    get:
      summary: List users
      tags: [Users]
      responses:
        '200':
          description: Success
```

**Generated Arcanine Collection:**

```
my-collection/
├── collection.yaml
├── environments/
│   ├── production.yaml      # baseUrl: https://api.example.com
│   └── development.yaml     # baseUrl: http://localhost:3000
└── users/
    ├── folder.yaml          # Tag: Users
    └── list-users.request.yaml
```

### From cURL

#### Command Line

```bash
# Import single cURL command
arcanine import curl \
  --command "curl -X POST https://api.example.com/login \
    -H 'Content-Type: application/json' \
    -d '{\"email\":\"user@example.com\"}'" \
  --output ./my-collection/login.request.yaml

# Import from file
arcanine import curl \
  --file ./curl-commands.txt \
  --output ./my-collection
```

#### Via GUI

1. File → Import → cURL Command
2. Paste cURL command
3. Choose target location
4. Review and confirm

### From HAR

```bash
# Import HTTP Archive
arcanine import har \
  --file ./network-trace.har \
  --output ./my-collection \
  --filter "api.example.com"
```

## Exporting Collections

### To Postman

#### Command Line

```bash
# Export to Postman format
arcanine export postman \
  --collection ./my-collection \
  --output ./postman_collection.json

# Export with environment
arcanine export postman \
  --collection ./my-collection \
  --environment development \
  --output ./postman_collection.json \
  --env-output ./postman_environment.json
```

#### Via GUI

1. File → Export → Postman Collection
2. Select environment (optional)
3. Choose output location
4. Export

### To Insomnia

```bash
# Export to Insomnia format
arcanine export insomnia \
  --collection ./my-collection \
  --output ./insomnia_workspace.json
```

### To OpenAPI

```bash
# Generate OpenAPI specification
arcanine export openapi \
  --collection ./my-collection \
  --output ./openapi.yaml \
  --version 3.1.0 \
  --server-url "https://api.example.com"
```

### To cURL

```bash
# Export single request as cURL
arcanine export curl \
  --request ./my-collection/login.request.yaml \
  --environment development \
  --output ./login.sh

# Export all requests
arcanine export curl \
  --collection ./my-collection \
  --output ./curl-commands/
```

### To Markdown

```bash
# Generate documentation
arcanine export markdown \
  --collection ./my-collection \
  --output ./API_DOCS.md \
  --include-examples \
  --include-schemas
```

**Generated Markdown:**

````markdown
# My API Collection

API endpoints for MyService

## Authentication

### Login

`POST /auth/login`

Authenticate user and get access token.

**Headers:**

- `Content-Type`: application/json

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
````

**Response:**

```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "123",
    "email": "user@example.com"
  }
}
```

````

## Format Conversion

### Script Conversion

#### Postman to Arcanine

**Postman:**
```javascript
pm.test("Status is 200", function() {
  pm.response.to.have.status(200);
});

pm.environment.set("token", pm.response.json().token);
````

**Arcanine:**

```javascript
// Test
assert(response.status === 200, 'Expected status 200');

// Post-response script
const data = response.json();
env.set('token', data.token);
```

#### Insomnia to Arcanine

**Insomnia:**

```javascript
const response = await insomnia.send();
insomnia.environment.set('token', response.data.token);
```

**Arcanine:**

```javascript
// Happens automatically after request
const data = response.json();
env.set('token', data.token);
```

### Authentication Conversion

| Source           | Target          | Conversion              |
| ---------------- | --------------- | ----------------------- |
| Postman Bearer   | Arcanine Bearer | Direct mapping          |
| Postman OAuth2   | Arcanine OAuth2 | Configuration preserved |
| Insomnia Basic   | Arcanine Basic  | Direct mapping          |
| OpenAPI Security | Arcanine Auth   | Auto-detected           |

## Migration Strategies

### Strategy 1: Gradual Migration

```bash
# Step 1: Import existing collection
arcanine import postman --file collection.json --output ./new-collection

# Step 2: Use both tools in parallel
# - New features in Arcanine
# - Existing workflows in Postman

# Step 3: Migrate team gradually
# - Share git repository
# - Team members clone and use Arcanine

# Step 4: Deprecate old tool
# - Archive Postman collection
# - Full adoption of Arcanine
```

### Strategy 2: Clean Slate

```bash
# Start fresh with Arcanine
arcanine init --template rest-api

# Manually recreate critical requests
# Benefits: Clean structure, optimized organization
```

### Strategy 3: Hybrid Approach

```bash
# Import base collection
arcanine import postman --file collection.json --output ./api

# Reorganize structure
# - Group by feature
# - Add documentation
# - Optimize scripts

# Keep exportable to Postman
arcanine export postman --collection ./api --output ./backup.json
```

## Troubleshooting

### Import Issues

#### Missing Variables

```bash
# Check imported variables
arcanine validate --collection ./my-collection

# List all variables
arcanine list-vars --collection ./my-collection
```

#### Script Conversion Errors

```yaml
# Original Postman script with pm.* APIs
# May need manual conversion

# Before (Postman)
pm.test("Check status", () => {
  pm.response.to.have.status(200);
});

# After (Arcanine) - manual fix
tests:
  - name: "Check status"
    script: |
      assert(response.status === 200);
```

#### Authentication Issues

```bash
# Review authentication after import
arcanine show-auth --collection ./my-collection

# Update if needed
# Edit collection.yaml or request files
```

### Export Issues

#### Incompatible Features

Some Arcanine features may not export perfectly:

- **Deno scripts**: May need adjustment for Postman/Insomnia
- **Self-contained ordering**: Lost in flat export formats
- **Advanced assertions**: May be simplified

#### Workaround

```bash
# Export with compatibility mode
arcanine export postman \
  --collection ./my-collection \
  --output ./collection.json \
  --compatibility-mode \
  --simplify-scripts
```

### Validation

```bash
# Validate collection after import/export
arcanine validate \
  --collection ./my-collection \
  --strict

# Check for issues
arcanine lint --collection ./my-collection

# Fix common issues
arcanine fix --collection ./my-collection --auto
```

## Best Practices

### 1. Backup Before Import

```bash
# Always backup existing data
cp -r ./my-collection ./my-collection.backup

# Then import
arcanine import postman --file collection.json --output ./my-collection
```

### 2. Review After Import

```bash
# Check collection structure
arcanine tree --collection ./my-collection

# Verify variables
arcanine list-vars --collection ./my-collection

# Test critical requests
arcanine run --collection ./my-collection --folder critical
```

### 3. Maintain Compatibility

```yaml
# Keep collections exportable
# Avoid Arcanine-specific features if you need to export

# Or maintain parallel versions
arcanine export postman --output ./for-postman.json
arcanine export insomnia --output ./for-insomnia.json
```

### 4. Document Changes

```markdown
# MIGRATION.md

## Migration from Postman

Date: 2024-11-29
Source: postman_collection_v2.1.json
Target: arcanine-collection/

### Changes Made:

- Reorganized into feature-based folders
- Converted pm.\* APIs to Deno equivalents
- Separated secrets into .secrets/ directory
- Added comprehensive documentation

### Manual Adjustments Required:

- Update team environment variables
- Configure OAuth credentials
- Review and test all scripts
```

### 5. Version Control

```bash
# Initialize git after import
cd my-collection
git init
git add .
git commit -m "Initial import from Postman"

# Tag the import
git tag -a v1.0.0-imported -m "Imported from Postman"
```

## Migration Checklist

- [ ] Backup existing collections
- [ ] Import collection to Arcanine
- [ ] Review and validate structure
- [ ] Test critical requests
- [ ] Update environment variables
- [ ] Configure secrets
- [ ] Review and adjust scripts
- [ ] Add documentation
- [ ] Initialize version control
- [ ] Share with team
- [ ] Train team members
- [ ] Monitor and iterate

---

For more information:

- [Architecture Overview](README.md)
- [Collection Structure](collection-structure.md)
- [Environment Management](environments.md)
- [Scripting Guide](scripting.md)
