use crate::models::error::{ModelError, ModelResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;

/// HTTP methods supported by Arcanine
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

impl fmt::Display for HttpMethod {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            HttpMethod::Get => write!(f, "GET"),
            HttpMethod::Post => write!(f, "POST"),
            HttpMethod::Put => write!(f, "PUT"),
            HttpMethod::Patch => write!(f, "PATCH"),
            HttpMethod::Delete => write!(f, "DELETE"),
            HttpMethod::Head => write!(f, "HEAD"),
            HttpMethod::Options => write!(f, "OPTIONS"),
        }
    }
}

/// Represents an HTTP request
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

impl Request {
    /// Creates a new request with the given name and URL
    pub fn new(name: impl Into<String>, url: impl Into<String>) -> Self {
        Self {
            method: HttpMethod::default(),
            url: url.into(),
            headers: HashMap::new(),
            body: None,
            name: name.into(),
        }
    }

    /// Sets the HTTP method
    pub fn with_method(mut self, method: HttpMethod) -> Self {
        self.method = method;
        self
    }

    /// Adds a header to the request
    pub fn with_header(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.headers.insert(key.into(), value.into());
        self
    }

    /// Sets the request body
    pub fn with_body(mut self, body: impl Into<String>) -> Self {
        self.body = Some(body.into());
        self
    }

    /// Validates the request
    pub fn validate(&self) -> ModelResult<()> {
        // Validate name is not empty
        if self.name.trim().is_empty() {
            return Err(ModelError::EmptyField("name".to_string()));
        }

        // Validate URL is not empty and has valid scheme
        if self.url.trim().is_empty() {
            return Err(ModelError::EmptyField("url".to_string()));
        }

        // Basic URL validation - must start with http:// or https://
        if !self.url.starts_with("http://") && !self.url.starts_with("https://") {
            return Err(ModelError::InvalidUrl(format!(
                "URL must start with http:// or https://: {}",
                self.url
            )));
        }

        // Validate URL contains domain
        let url_without_scheme = self
            .url
            .strip_prefix("http://")
            .or_else(|| self.url.strip_prefix("https://"))
            .unwrap_or(&self.url);

        if url_without_scheme.is_empty() || url_without_scheme == "/" {
            return Err(ModelError::InvalidUrl(format!(
                "URL must contain a domain: {}",
                self.url
            )));
        }

        Ok(())
    }
}

impl fmt::Display for Request {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} {} ({})", self.method, self.url, self.name)?;
        if !self.headers.is_empty() {
            write!(f, " with {} header(s)", self.headers.len())?;
        }
        if self.body.is_some() {
            write!(f, " with body")?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_request_creation() {
        let request = Request::new("Test Request", "https://api.example.com/users");

        assert_eq!(request.name, "Test Request");
        assert_eq!(request.url, "https://api.example.com/users");
        assert_eq!(request.method, HttpMethod::Get);
        assert!(request.headers.is_empty());
        assert!(request.body.is_none());
    }

    #[test]
    fn test_request_builder() {
        let request = Request::new("Create User", "https://api.example.com/users")
            .with_method(HttpMethod::Post)
            .with_header("Content-Type", "application/json")
            .with_header("Authorization", "Bearer token123")
            .with_body(r#"{"name": "John Doe"}"#);

        assert_eq!(request.method, HttpMethod::Post);
        assert_eq!(request.headers.len(), 2);
        assert_eq!(
            request.headers.get("Content-Type"),
            Some(&"application/json".to_string())
        );
        assert_eq!(request.body, Some(r#"{"name": "John Doe"}"#.to_string()));
    }

    #[test]
    fn test_http_method_serialization() {
        let get = HttpMethod::Get;
        let json = serde_json::to_string(&get).unwrap();
        assert_eq!(json, r#""GET""#);

        let post = HttpMethod::Post;
        let json = serde_json::to_string(&post).unwrap();
        assert_eq!(json, r#""POST""#);
    }

    #[test]
    fn test_request_serialization() {
        let request = Request::new("Test", "https://example.com")
            .with_method(HttpMethod::Get)
            .with_header("Accept", "application/json");

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains(r#""method":"GET""#));
        assert!(json.contains(r#""url":"https://example.com""#));
        assert!(json.contains(r#""name":"Test""#));
    }

    #[test]
    fn test_request_validation_success() {
        let request = Request::new("Valid Request", "https://api.example.com/users");
        assert!(request.validate().is_ok());

        let request = Request::new("HTTP Request", "http://example.com");
        assert!(request.validate().is_ok());
    }

    #[test]
    fn test_request_validation_empty_name() {
        let request = Request::new("", "https://example.com");
        let result = request.validate();
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            ModelError::EmptyField("name".to_string())
        );

        let request = Request::new("   ", "https://example.com");
        assert!(request.validate().is_err());
    }

    #[test]
    fn test_request_validation_empty_url() {
        let request = Request::new("Test", "");
        let result = request.validate();
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            ModelError::EmptyField("url".to_string())
        );
    }

    #[test]
    fn test_request_validation_invalid_scheme() {
        let request = Request::new("Test", "ftp://example.com");
        let result = request.validate();
        assert!(result.is_err());
        match result.unwrap_err() {
            ModelError::InvalidUrl(msg) => assert!(msg.contains("must start with http://")),
            _ => panic!("Expected InvalidUrl error"),
        }

        let request = Request::new("Test", "example.com");
        assert!(request.validate().is_err());
    }

    #[test]
    fn test_request_validation_no_domain() {
        let request = Request::new("Test", "https://");
        let result = request.validate();
        assert!(result.is_err());
        match result.unwrap_err() {
            ModelError::InvalidUrl(msg) => assert!(msg.contains("must contain a domain")),
            _ => panic!("Expected InvalidUrl error"),
        }
    }

    #[test]
    fn test_http_method_display() {
        assert_eq!(HttpMethod::Get.to_string(), "GET");
        assert_eq!(HttpMethod::Post.to_string(), "POST");
        assert_eq!(HttpMethod::Delete.to_string(), "DELETE");
    }

    #[test]
    fn test_request_display() {
        let request = Request::new("Test", "https://example.com");
        assert_eq!(request.to_string(), "GET https://example.com (Test)");

        let request = Request::new("Test", "https://api.example.com/users")
            .with_method(HttpMethod::Post)
            .with_header("Content-Type", "application/json")
            .with_body(r#"{"name": "John"}"#);
        assert_eq!(
            request.to_string(),
            "POST https://api.example.com/users (Test) with 1 header(s) with body"
        );
    }
}
