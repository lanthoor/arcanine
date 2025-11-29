# Data Models Architecture

This document describes the core data models used throughout Arcanine for representing HTTP requests, responses, and collections.

## Table of Contents

- [Overview](#overview)
- [Request Model](#request-model)
- [Response Model](#response-model)
- [Collection Model](#collection-model)
- [Error Model](#error-model)
- [Design Decisions](#design-decisions)
- [Usage Examples](#usage-examples)

---

## Overview

Arcanine's data models are designed with these principles:

- **Type Safety**: Strong typing with Rust's type system
- **Serialization**: Full serde support for JSON/YAML
- **Validation**: Explicit validation with helpful error messages
- **Ergonomics**: Builder patterns for easy construction
- **Debugging**: Display traits for human-readable output

All models are located in `src-tauri/src/models/`.

---

## Request Model

**File**: `src-tauri/src/models/request.rs`

### HttpMethod Enum

Represents HTTP methods supported by Arcanine.

```rust
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum HttpMethod {
    #[default]
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Head,
    Options,
}
```

**Features**:

- Default method is `GET`
- Serializes to uppercase strings (`"GET"`, `"POST"`, etc.)
- Implements `Display` for human-readable output

### Request Struct

Represents an HTTP request with all necessary information.

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Request {
    /// HTTP method (GET, POST, PUT, etc.)
    pub method: HttpMethod,

    /// Request URL
    pub url: String,

    /// Request headers as key-value pairs
    #[serde(default)]
    pub headers: HashMap<String, String>,

    /// Optional request body
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<String>,

    /// Request name for identification
    pub name: String,
}
```

**Methods**:

```rust
// Constructor
pub fn new(name: impl Into<String>, url: impl Into<String>) -> Self

// Builder methods
pub fn with_method(mut self, method: HttpMethod) -> Self
pub fn with_header(mut self, key: impl Into<String>, value: impl Into<String>) -> Self
pub fn with_body(mut self, body: impl Into<String>) -> Self

// Validation
pub fn validate(&self) -> ModelResult<()>
```

**Validation Rules**:

- Name must not be empty or whitespace
- URL must not be empty
- URL must start with `http://` or `https://`
- URL must contain a domain (not just scheme)

**Display Format**:

```
GET https://api.example.com/users (Get Users) with 2 header(s) with body
```

---

## Response Model

**File**: `src-tauri/src/models/response.rs`

### Response Struct

Represents an HTTP response with metadata.

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Response {
    /// HTTP status code (e.g., 200, 404, 500)
    pub status: u16,

    /// Response headers as key-value pairs
    #[serde(default)]
    pub headers: HashMap<String, String>,

    /// Response body as a string
    pub body: String,

    /// Time taken to receive the response
    #[serde(with = "duration_serde")]
    pub response_time: Duration,
}
```

**Methods**:

```rust
// Constructor
pub fn new(status: u16, body: impl Into<String>, response_time: Duration) -> Self

// Builder methods
pub fn with_header(mut self, key: impl Into<String>, value: impl Into<String>) -> Self

// Status helpers
pub fn is_success(&self) -> bool        // 2xx
pub fn is_client_error(&self) -> bool   // 4xx
pub fn is_server_error(&self) -> bool   // 5xx

// Validation
pub fn validate(&self) -> ModelResult<()>
```

**Validation Rules**:

- Status code must be in range 100-599 (valid HTTP status codes)

**Duration Serialization**:
Custom serde module serializes `Duration` as milliseconds (u64).

**Display Format**:

```
HTTP 200 (150 ms) with 3 header(s), 1024 bytes
```

---

## Collection Model

**File**: `src-tauri/src/models/collection.rs`

### CollectionMetadata Struct

Metadata associated with a collection.

```rust
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CollectionMetadata {
    /// Collection version
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,

    /// Collection author
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,

    /// Creation timestamp (ISO 8601 format)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,

    /// Last modified timestamp (ISO 8601 format)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}
```

**Default**: Version is `"1.0.0"`, all other fields are `None`.

### Collection Struct

Represents a collection of HTTP requests.

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Collection {
    /// Collection name
    pub name: String,

    /// List of requests in this collection
    #[serde(default)]
    pub requests: Vec<Request>,

    /// Optional description of the collection
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// Collection metadata (version, author, etc.)
    #[serde(default)]
    pub metadata: CollectionMetadata,
}
```

**Methods**:

```rust
// Constructor
pub fn new(name: impl Into<String>) -> Self

// Builder methods
pub fn with_description(mut self, description: impl Into<String>) -> Self
pub fn add_request(mut self, request: Request) -> Self
pub fn with_author(mut self, author: impl Into<String>) -> Self

// Query methods
pub fn len(&self) -> usize
pub fn is_empty(&self) -> bool
pub fn find_request(&self, name: &str) -> Option<&Request>
```

**Display Format**:

```
Collection 'My API' (5 request(s)): API endpoints for user management
```

---

## Error Model

**File**: `src-tauri/src/models/error.rs`

### ModelError Enum

Custom error type for model validation.

```rust
#[derive(Debug, Clone, PartialEq)]
pub enum ModelError {
    /// Invalid URL format
    InvalidUrl(String),

    /// Invalid HTTP method
    InvalidMethod(String),

    /// Invalid status code (must be 100-599)
    InvalidStatusCode(u16),

    /// Empty required field
    EmptyField(String),

    /// Validation error with custom message
    ValidationError(String),
}
```

**Type Alias**:

```rust
pub type ModelResult<T> = Result<T, ModelError>;
```

**Traits**:

- `Display` - Human-readable error messages
- `Error` - Standard error trait
- `Clone`, `Debug`, `PartialEq` - Common derives

**Error Messages**:

```rust
InvalidUrl("http://") → "Invalid URL: URL must contain a domain: http://"
InvalidStatusCode(600) → "Invalid status code: 600 (must be 100-599)"
EmptyField("name") → "Required field is empty: name"
```

---

## Design Decisions

### 1. Why Separate Validation?

**Decision**: Validation is explicit via `validate()` methods, not in constructors or builders.

**Rationale**:

- **Flexibility**: Allow constructing invalid models for testing or intermediate states
- **Explicit**: Make validation calls obvious in code
- **Composability**: Chain builders without validation interruptions
- **Error Handling**: Return `Result` only when validation is needed

**Example**:

```rust
let request = Request::new("", "invalid-url")  // Allowed
    .with_method(HttpMethod::Get);

// Validation is explicit
match request.validate() {
    Ok(()) => { /* proceed */ },
    Err(e) => { /* handle error */ }
}
```

### 2. Why HashMap for Headers?

**Decision**: Use `HashMap<String, String>` instead of `Vec<(String, String)>`.

**Rationale**:

- **Simple**: Most common use case is unique header names
- **Fast Lookup**: O(1) access by header name
- **Ergonomic**: Easy to add/remove/update headers
- **Serialization**: Clean JSON/YAML representation

**Trade-off**: Can't have duplicate header names (rare in practice, will be addressed if needed).

### 3. Why Option<String> for Body?

**Decision**: Request body is `Option<String>` instead of `String`.

**Rationale**:

- **Semantic**: Distinguishes "no body" from "empty body"
- **Serialization**: Skips field in JSON when `None`
- **Clarity**: Makes intent explicit

### 4. Why Custom Duration Serialization?

**Decision**: Serialize `Duration` as milliseconds (u64) instead of Rust's default.

**Rationale**:

- **Readability**: `250` is clearer than `{"secs": 0, "nanos": 250000000}`
- **Size**: Smaller JSON representation
- **Interop**: Easier for frontend to consume
- **Precision**: Milliseconds are sufficient for HTTP timing

### 5. Why Display Traits?

**Decision**: Implement `Display` for all public types.

**Rationale**:

- **Debugging**: Easy to print models in logs
- **Testing**: Readable test output
- **Error Messages**: Include model context in errors
- **CLI Tools**: Future CLI can display models

---

## Usage Examples

### Creating a GET Request

```rust
use arcanine::models::{Request, HttpMethod};

let request = Request::new("Get Users", "https://api.example.com/users")
    .with_method(HttpMethod::Get)
    .with_header("Authorization", "Bearer token123")
    .with_header("Accept", "application/json");

// Validate before sending
request.validate()?;
```

### Creating a POST Request

```rust
let request = Request::new("Create User", "https://api.example.com/users")
    .with_method(HttpMethod::Post)
    .with_header("Content-Type", "application/json")
    .with_body(r#"{"name": "John Doe", "email": "john@example.com"}"#);

request.validate()?;
```

### Building a Response

```rust
use arcanine::models::Response;
use std::time::Duration;

let response = Response::new(200, r#"{"id": 1, "name": "John"}"#, Duration::from_millis(150))
    .with_header("Content-Type", "application/json")
    .with_header("X-Request-ID", "abc123");

assert!(response.is_success());
```

### Creating a Collection

```rust
use arcanine::models::{Collection, Request, HttpMethod};

let request1 = Request::new("Get Users", "https://api.example.com/users");
let request2 = Request::new("Create User", "https://api.example.com/users")
    .with_method(HttpMethod::Post);

let collection = Collection::new("User API")
    .with_description("API endpoints for user management")
    .with_author("Jane Doe")
    .add_request(request1)
    .add_request(request2);

assert_eq!(collection.len(), 2);
```

### Serialization Example

```rust
use serde_json;

let request = Request::new("Test", "https://example.com");
let json = serde_json::to_string_pretty(&request)?;

println!("{}", json);
// {
//   "method": "GET",
//   "url": "https://example.com",
//   "headers": {},
//   "name": "Test"
// }
```

### Error Handling

```rust
use arcanine::models::{Request, ModelError};

let request = Request::new("", "https://example.com");

match request.validate() {
    Ok(()) => println!("Request is valid"),
    Err(ModelError::EmptyField(field)) => {
        eprintln!("Field '{}' cannot be empty", field);
    }
    Err(ModelError::InvalidUrl(msg)) => {
        eprintln!("Invalid URL: {}", msg);
    }
    Err(e) => eprintln!("Validation error: {}", e),
}
```

---

## JSON Schema Reference

### Request JSON

```json
{
  "method": "GET",
  "url": "https://api.example.com/users",
  "headers": {
    "Authorization": "Bearer token123",
    "Accept": "application/json"
  },
  "body": "{\"limit\": 10}",
  "name": "Get Users"
}
```

### Response JSON

```json
{
  "status": 200,
  "headers": {
    "Content-Type": "application/json",
    "X-Request-ID": "abc123"
  },
  "body": "{\"id\": 1, \"name\": \"John\"}",
  "response_time": 150
}
```

### Collection JSON

```json
{
  "name": "User API",
  "requests": [
    {
      "method": "GET",
      "url": "https://api.example.com/users",
      "headers": {},
      "name": "Get Users"
    }
  ],
  "description": "API endpoints for user management",
  "metadata": {
    "version": "1.0.0",
    "author": "Jane Doe",
    "created_at": "2025-11-30T10:00:00Z",
    "updated_at": "2025-11-30T15:30:00Z"
  }
}
```

---

## Future Enhancements

### Planned Features

1. **Query Parameters**: Add `query_params` field to Request
2. **Form Data**: Support multipart/form-data and urlencoded
3. **Binary Bodies**: Support binary request/response bodies
4. **Cookies**: Add cookie handling to Request/Response
5. **Certificates**: Client certificate support in Request
6. **Timeouts**: Add timeout configuration to Request
7. **Redirects**: Track redirect chain in Response
8. **Compression**: Support gzip/deflate in Response
9. **Validation Rules**: Custom validation rules per field
10. **Immutability**: Consider making models immutable with builder pattern only

### Extension Points

The models are designed to be extended:

```rust
// Future: Add query parameters
pub struct Request {
    // ...existing fields...
    #[serde(default)]
    pub query_params: HashMap<String, String>,
}

// Future: Add cookies
pub struct Response {
    // ...existing fields...
    #[serde(default)]
    pub cookies: Vec<Cookie>,
}
```

---

## Testing

All models have comprehensive test coverage (100%):

- **Unit Tests**: Each method has dedicated tests
- **Validation Tests**: All validation rules are tested
- **Serialization Tests**: Round-trip JSON conversion
- **Display Tests**: Human-readable output verification
- **Builder Tests**: Fluent API functionality
- **Edge Cases**: Empty strings, invalid data, boundary values

See individual model files for test implementations.

---

## Related Documentation

- [Architecture Overview](README.md) - System architecture
- [YAML Schema](yaml-schema.md) - File format specification
- [Phase 1.3 Completion](../progress/phase-1.3-completion.md) - Implementation details
- [Development Plan](../plan/README.md) - Overall roadmap

---

**Last Updated**: November 30, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
