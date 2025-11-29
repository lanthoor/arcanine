use std::fmt;

/// Errors that can occur when working with models
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

impl fmt::Display for ModelError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ModelError::InvalidUrl(url) => write!(f, "Invalid URL: {}", url),
            ModelError::InvalidMethod(method) => write!(f, "Invalid HTTP method: {}", method),
            ModelError::InvalidStatusCode(code) => {
                write!(f, "Invalid status code: {} (must be 100-599)", code)
            }
            ModelError::EmptyField(field) => write!(f, "Required field is empty: {}", field),
            ModelError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
        }
    }
}

impl std::error::Error for ModelError {}

/// Result type for model operations
pub type ModelResult<T> = Result<T, ModelError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = ModelError::InvalidUrl("not-a-url".to_string());
        assert_eq!(err.to_string(), "Invalid URL: not-a-url");

        let err = ModelError::InvalidStatusCode(600);
        assert_eq!(
            err.to_string(),
            "Invalid status code: 600 (must be 100-599)"
        );

        let err = ModelError::EmptyField("name".to_string());
        assert_eq!(err.to_string(), "Required field is empty: name");
    }

    #[test]
    fn test_error_equality() {
        let err1 = ModelError::InvalidUrl("test".to_string());
        let err2 = ModelError::InvalidUrl("test".to_string());
        let err3 = ModelError::InvalidUrl("other".to_string());

        assert_eq!(err1, err2);
        assert_ne!(err1, err3);
    }
}
