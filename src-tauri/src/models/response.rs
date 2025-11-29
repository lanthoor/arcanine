use crate::models::error::{ModelError, ModelResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;
use std::time::Duration;

/// Represents an HTTP response
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

impl Response {
    /// Creates a new response
    pub fn new(status: u16, body: impl Into<String>, response_time: Duration) -> Self {
        Self {
            status,
            headers: HashMap::new(),
            body: body.into(),
            response_time,
        }
    }

    /// Adds a header to the response
    pub fn with_header(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.headers.insert(key.into(), value.into());
        self
    }

    /// Checks if the response status is successful (2xx)
    pub fn is_success(&self) -> bool {
        (200..300).contains(&self.status)
    }

    /// Checks if the response status is a client error (4xx)
    pub fn is_client_error(&self) -> bool {
        (400..500).contains(&self.status)
    }

    /// Checks if the response status is a server error (5xx)
    pub fn is_server_error(&self) -> bool {
        (500..600).contains(&self.status)
    }

    /// Validates the response
    pub fn validate(&self) -> ModelResult<()> {
        // Validate status code is in valid HTTP range (100-599)
        if !(100..600).contains(&self.status) {
            return Err(ModelError::InvalidStatusCode(self.status));
        }

        Ok(())
    }
}

impl fmt::Display for Response {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "HTTP {} ({} ms)",
            self.status,
            self.response_time.as_millis()
        )?;
        if !self.headers.is_empty() {
            write!(f, " with {} header(s)", self.headers.len())?;
        }
        if !self.body.is_empty() {
            write!(f, ", {} bytes", self.body.len())?;
        }
        Ok(())
    }
}

// Helper module for serializing/deserializing Duration as milliseconds
mod duration_serde {
    use serde::{Deserialize, Deserializer, Serializer};
    use std::time::Duration;

    pub fn serialize<S>(duration: &Duration, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u64(duration.as_millis() as u64)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Duration, D::Error>
    where
        D: Deserializer<'de>,
    {
        let millis = u64::deserialize(deserializer)?;
        Ok(Duration::from_millis(millis))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_response_creation() {
        let response = Response::new(200, "OK", Duration::from_millis(150));

        assert_eq!(response.status, 200);
        assert_eq!(response.body, "OK");
        assert_eq!(response.response_time, Duration::from_millis(150));
        assert!(response.headers.is_empty());
    }

    #[test]
    fn test_response_with_headers() {
        let response = Response::new(200, r#"{"message": "success"}"#, Duration::from_millis(100))
            .with_header("Content-Type", "application/json")
            .with_header("X-Request-ID", "abc123");

        assert_eq!(response.headers.len(), 2);
        assert_eq!(
            response.headers.get("Content-Type"),
            Some(&"application/json".to_string())
        );
    }

    #[test]
    fn test_response_status_checks() {
        let success = Response::new(200, "", Duration::from_millis(100));
        assert!(success.is_success());
        assert!(!success.is_client_error());
        assert!(!success.is_server_error());

        let not_found = Response::new(404, "", Duration::from_millis(100));
        assert!(!not_found.is_success());
        assert!(not_found.is_client_error());
        assert!(!not_found.is_server_error());

        let server_error = Response::new(500, "", Duration::from_millis(100));
        assert!(!server_error.is_success());
        assert!(!server_error.is_client_error());
        assert!(server_error.is_server_error());
    }

    #[test]
    fn test_response_serialization() {
        let response = Response::new(200, "Test Body", Duration::from_millis(250))
            .with_header("Content-Type", "text/plain");

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains(r#""status":200"#));
        assert!(json.contains(r#""body":"Test Body""#));
        assert!(json.contains(r#""response_time":250"#));

        // Test deserialization
        let deserialized: Response = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.status, 200);
        assert_eq!(deserialized.response_time, Duration::from_millis(250));
    }

    #[test]
    fn test_response_validation_success() {
        let response = Response::new(200, "OK", Duration::from_millis(100));
        assert!(response.validate().is_ok());

        let response = Response::new(100, "", Duration::from_millis(100));
        assert!(response.validate().is_ok());

        let response = Response::new(599, "", Duration::from_millis(100));
        assert!(response.validate().is_ok());
    }

    #[test]
    fn test_response_validation_invalid_status() {
        let response = Response::new(99, "", Duration::from_millis(100));
        let result = response.validate();
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), ModelError::InvalidStatusCode(99));

        let response = Response::new(600, "", Duration::from_millis(100));
        let result = response.validate();
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), ModelError::InvalidStatusCode(600));

        let response = Response::new(0, "", Duration::from_millis(100));
        assert!(response.validate().is_err());
    }

    #[test]
    fn test_response_display() {
        let response = Response::new(200, "OK", Duration::from_millis(150));
        assert_eq!(response.to_string(), "HTTP 200 (150 ms), 2 bytes");

        let response = Response::new(404, "", Duration::from_millis(50))
            .with_header("Content-Type", "text/html");
        assert_eq!(response.to_string(), "HTTP 404 (50 ms) with 1 header(s)");
    }
}
