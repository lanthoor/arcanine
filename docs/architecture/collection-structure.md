# Collection Structure Guide

Complete guide to organizing and structuring collections in Arcanine.

## Table of Contents

- [Overview](#overview)
- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [Ordering System](#ordering-system)
- [Folder Hierarchy](#folder-hierarchy)
- [Best Practices](#best-practices)
- [Example Collections](#example-collections)

## Overview

Arcanine uses a file-based structure where:

- Each request is a separate YAML file
- Folders contain a `folder.yaml` metadata file
- Collections have a `collection.yaml` root file
- Environments are stored in a dedicated directory
- Everything is version-controlled via Git

### Key Principles

1. **Decentralized Ordering**: Each element maintains its own position via `order` field
2. **Self-contained**: Each file contains all necessary information
3. **Git-friendly**: Changes affect minimal files
4. **Hierarchical**: Folders can nest indefinitely
5. **Flexible**: Root-level requests are supported

## File Organization

### Basic Structure

```
my-api-collection/
├── collection.yaml              # Collection metadata
├── .gitignore                   # Ignore secrets
├── README.md                    # Collection documentation
│
├── environments/                # Environments directory
│   ├── development.yaml
│   ├── staging.yaml
│   ├── production.yaml
│   └── .secrets/               # Gitignored secrets
│       ├── development.secrets.yaml
│       ├── staging.secrets.yaml
│       └── production.secrets.yaml
│
├── get-health.request.yaml     # Root-level request (order: 1)
├── get-version.request.yaml    # Root-level request (order: 2)
│
├── authentication/              # Folder (order: 3)
│   ├── folder.yaml
│   ├── login.request.yaml      # (order: 1)
│   ├── register.request.yaml   # (order: 2)
│   └── logout.request.yaml     # (order: 3)
│
└── users/                      # Folder (order: 4)
    ├── folder.yaml
    ├── list-users.request.yaml # (order: 1)
    ├── create-user.request.yaml # (order: 2)
    └── profile/                # Sub-folder (order: 3)
        ├── folder.yaml
        ├── get-profile.request.yaml
        └── update-profile.request.yaml
```

### File Types

| File               | Purpose                                 | Required               |
| ------------------ | --------------------------------------- | ---------------------- |
| `collection.yaml`  | Collection metadata and global settings | Yes                    |
| `folder.yaml`      | Folder metadata and settings            | Yes (for folders)      |
| `*.request.yaml`   | Individual request definition           | Yes (for requests)     |
| `environment.yaml` | Environment variables                   | Yes (in environments/) |
| `.secrets.yaml`    | Secret values (gitignored)              | No                     |
| `.gitignore`       | Git ignore rules                        | Recommended            |
| `README.md`        | Collection documentation                | Recommended            |

## Naming Conventions

### Collection Directories

```
# Good
my-api-collection/
user-service-api/
ecommerce-api-v2/

# Avoid
My API Collection/
UserServiceAPI/
api_v2/
```

**Rules:**

- Use kebab-case (lowercase with hyphens)
- Be descriptive
- Avoid spaces and special characters

### Folder Names

```
# Good
authentication/
user-management/
payment-processing/
admin-operations/

# Avoid
Auth/
userManagement/
payment_processing/
AdminOps/
```

**Rules:**

- Use kebab-case
- Be descriptive but concise
- Group related requests logically

### Request Files

```
# Good
login.request.yaml
get-users.request.yaml
create-order.request.yaml
update-profile.request.yaml

# Avoid
Login.request.yaml
getUsers.request.yaml
CreateOrder.yaml
profile_update.request.yaml
```

**Rules:**

- Use kebab-case
- Start with verb (get, post, create, update, delete)
- Must end with `.request.yaml`
- Be descriptive and specific

### Environment Files

```
# Good
development.yaml
staging.yaml
production.yaml
local-docker.yaml

# Avoid
Dev.yaml
STAGING.yaml
prod.yml
local.yaml
```

**Rules:**

- Use kebab-case
- Be explicit about environment
- Use `.yaml` extension (not `.yml`)

## Ordering System

### How Ordering Works

Each element (folder or request) has an `order` field that determines its position within its parent.

```yaml
# collection.yaml (no order field - it's the root)

# get-health.request.yaml
order: 1  # First in collection

# get-version.request.yaml
order: 2  # Second in collection

# authentication/folder.yaml
order: 3  # Third in collection

# users/folder.yaml
order: 4  # Fourth in collection
```

### Order Values

**Recommended:** Use multiples of 10 to allow easy insertion

```yaml
# Initial structure
get-health.request.yaml: order: 10
get-version.request.yaml: order: 20
authentication/folder.yaml: order: 30
users/folder.yaml: order: 40

# Easy to insert between
get-status.request.yaml: order: 15  # Between health and version
```

### Reordering Items

To move an item, change only its `order` value:

```yaml
# Before
authentication/folder.yaml: order: 30
users/folder.yaml: order: 40

# After (swap positions)
authentication/folder.yaml: order: 40
users/folder.yaml: order: 30
```

### Handling Order Conflicts

If two items have the same order:

- They will be sorted alphabetically by filename
- Consider using decimal values: `order: 15.5`
- Or reassign orders to maintain clarity

## Folder Hierarchy

### Single Level

```
collection/
├── collection.yaml
├── auth/
│   ├── folder.yaml
│   └── login.request.yaml
└── users/
    ├── folder.yaml
    └── get-users.request.yaml
```

### Multi-Level

```
collection/
├── collection.yaml
└── api/
    ├── folder.yaml
    ├── v1/
    │   ├── folder.yaml
    │   ├── users/
    │   │   ├── folder.yaml
    │   │   ├── get-users.request.yaml
    │   │   └── create-user.request.yaml
    │   └── products/
    │       ├── folder.yaml
    │       └── get-products.request.yaml
    └── v2/
        ├── folder.yaml
        └── users/
            ├── folder.yaml
            └── get-users.request.yaml
```

### Mixed (Root + Folders)

```
collection/
├── collection.yaml
├── health-check.request.yaml    # Root-level
├── version.request.yaml          # Root-level
├── auth/
│   ├── folder.yaml
│   └── login.request.yaml
└── users/
    ├── folder.yaml
    └── get-users.request.yaml
```

## Best Practices

### 1. Logical Grouping

Group related requests into folders:

```
# Good structure
authentication/
├── login.request.yaml
├── register.request.yaml
├── logout.request.yaml
└── forgot-password.request.yaml

users/
├── list-users.request.yaml
├── get-user.request.yaml
├── create-user.request.yaml
├── update-user.request.yaml
└── delete-user.request.yaml

# Avoid flat structure
collection/
├── login.request.yaml
├── register.request.yaml
├── list-users.request.yaml
├── get-user.request.yaml
├── create-user.request.yaml
└── ... (50 more files)
```

### 2. Consistent Naming

Use consistent patterns across the collection:

```
# Good (consistent verb-noun pattern)
get-users.request.yaml
create-user.request.yaml
update-user.request.yaml
delete-user.request.yaml

get-products.request.yaml
create-product.request.yaml
update-product.request.yaml
delete-product.request.yaml

# Avoid inconsistency
users-list.request.yaml
user-create.request.yaml
updateUser.request.yaml
DeleteUser.request.yaml
```

### 3. Use Folder Documentation

Document folder purpose in `folder.yaml`:

```yaml
version: '1.0'
name: 'User Management'
order: 10

documentation: |
  # User Management Endpoints

  These endpoints handle all user-related operations:
  - User CRUD operations
  - Profile management
  - User preferences

  ## Authentication
  All endpoints require Bearer token authentication.

  ## Rate Limits
  - 100 requests per minute per user
  - 1000 requests per hour per user
```

### 4. Separate Public and Private

```
collection/
├── public/
│   ├── folder.yaml
│   ├── health.request.yaml
│   └── status.request.yaml
└── private/
    ├── folder.yaml
    ├── admin/
    │   └── ...
    └── users/
        └── ...
```

### 5. Version Your API

```
collection/
├── v1/
│   ├── folder.yaml
│   ├── users/
│   └── products/
├── v2/
│   ├── folder.yaml
│   ├── users/
│   └── products/
└── v3/
    ├── folder.yaml (in development)
    └── users/
```

### 6. Use Meaningful Order

Order items logically:

```yaml
# Authentication first (users need to login)
authentication/: order: 10

# Then main resources
users/: order: 20
products/: order: 30
orders/: order: 40

# Admin operations last
admin/: order: 100
```

### 7. Keep Folders Focused

```
# Good (focused)
users/
├── folder.yaml
├── list-users.request.yaml
├── get-user.request.yaml
├── create-user.request.yaml
├── update-user.request.yaml
└── delete-user.request.yaml

# Avoid (too broad)
api/
├── users.request.yaml
├── products.request.yaml
├── orders.request.yaml
└── ... (everything in one folder)
```

### 8. Document Dependencies

```yaml
# login.request.yaml
documentation: |
  # Login Endpoint

  ## Returns
  - accessToken: Use this for subsequent authenticated requests
  - refreshToken: Use this to refresh the access token

  ## Next Steps
  After login, use the accessToken in the Authorization header:
  - See: get-profile.request.yaml
  - See: update-profile.request.yaml
```

## Example Collections

### Minimal Collection

```
minimal-api/
├── collection.yaml
├── environments/
│   └── development.yaml
└── get-status.request.yaml
```

### Small API Collection

```
blog-api/
├── collection.yaml
├── .gitignore
├── README.md
├── environments/
│   ├── development.yaml
│   └── production.yaml
├── health.request.yaml
├── auth/
│   ├── folder.yaml
│   ├── login.request.yaml
│   └── register.request.yaml
└── posts/
    ├── folder.yaml
    ├── list-posts.request.yaml
    ├── get-post.request.yaml
    ├── create-post.request.yaml
    ├── update-post.request.yaml
    └── delete-post.request.yaml
```

### Medium API Collection

```
ecommerce-api/
├── collection.yaml
├── .gitignore
├── README.md
├── environments/
│   ├── development.yaml
│   ├── staging.yaml
│   ├── production.yaml
│   └── .secrets/
│       ├── development.secrets.yaml
│       ├── staging.secrets.yaml
│       └── production.secrets.yaml
│
├── health.request.yaml
├── version.request.yaml
│
├── auth/
│   ├── folder.yaml
│   ├── login.request.yaml
│   ├── register.request.yaml
│   ├── logout.request.yaml
│   └── refresh-token.request.yaml
│
├── users/
│   ├── folder.yaml
│   ├── profile/
│   │   ├── folder.yaml
│   │   ├── get-profile.request.yaml
│   │   └── update-profile.request.yaml
│   └── preferences/
│       ├── folder.yaml
│       ├── get-preferences.request.yaml
│       └── update-preferences.request.yaml
│
├── products/
│   ├── folder.yaml
│   ├── list-products.request.yaml
│   ├── get-product.request.yaml
│   ├── search-products.request.yaml
│   └── categories/
│       ├── folder.yaml
│       └── list-categories.request.yaml
│
├── cart/
│   ├── folder.yaml
│   ├── get-cart.request.yaml
│   ├── add-item.request.yaml
│   ├── update-item.request.yaml
│   └── remove-item.request.yaml
│
├── orders/
│   ├── folder.yaml
│   ├── create-order.request.yaml
│   ├── get-order.request.yaml
│   ├── list-orders.request.yaml
│   └── cancel-order.request.yaml
│
└── admin/
    ├── folder.yaml
    ├── users/
    │   ├── folder.yaml
    │   ├── list-users.request.yaml
    │   └── ban-user.request.yaml
    └── products/
        ├── folder.yaml
        ├── create-product.request.yaml
        ├── update-product.request.yaml
        └── delete-product.request.yaml
```

### Large API Collection

```
enterprise-api/
├── collection.yaml
├── .gitignore
├── README.md
├── CHANGELOG.md
│
├── environments/
│   ├── local.yaml
│   ├── development.yaml
│   ├── staging.yaml
│   ├── production.yaml
│   └── .secrets/
│
├── docs/
│   ├── authentication.md
│   ├── rate-limits.md
│   └── error-codes.md
│
├── common/
│   ├── folder.yaml
│   ├── health.request.yaml
│   ├── version.request.yaml
│   └── metrics.request.yaml
│
├── v1/
│   ├── folder.yaml
│   ├── auth/
│   ├── users/
│   ├── products/
│   └── orders/
│
├── v2/
│   ├── folder.yaml
│   ├── auth/
│   ├── users/
│   ├── products/
│   ├── orders/
│   └── analytics/
│
└── internal/
    ├── folder.yaml
    ├── admin/
    ├── monitoring/
    └── maintenance/
```

## Collection Templates

### REST API Template

```bash
# Create from template
arcanine init --template rest-api

# Structure created:
rest-api/
├── collection.yaml
├── .gitignore
├── README.md
├── environments/
│   ├── development.yaml
│   └── production.yaml
├── health.request.yaml
└── auth/
    ├── folder.yaml
    └── login.request.yaml
```

### GraphQL API Template

```bash
arcanine init --template graphql

# Structure created:
graphql-api/
├── collection.yaml
├── .gitignore
├── environments/
│   └── development.yaml
└── queries/
    ├── folder.yaml
    ├── users.request.yaml
    └── posts.request.yaml
```

### Microservices Template

```bash
arcanine init --template microservices

# Structure created:
microservices/
├── collection.yaml
├── auth-service/
│   ├── folder.yaml
│   └── ...
├── user-service/
│   ├── folder.yaml
│   └── ...
└── order-service/
    ├── folder.yaml
    └── ...
```

---

For more information:

- [Architecture Overview](README.md)
- [YAML Schema Reference](yaml-schema.md)
- [Environment Management](environments.md)
