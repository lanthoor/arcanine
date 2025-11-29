use crate::models::Request;
use serde::{Deserialize, Serialize};
use std::fmt;

/// Represents a collection of HTTP requests
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

/// Metadata associated with a collection
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

impl Default for CollectionMetadata {
    fn default() -> Self {
        Self {
            version: Some("1.0.0".to_string()),
            author: None,
            created_at: None,
            updated_at: None,
        }
    }
}

impl Collection {
    /// Creates a new collection with the given name
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            requests: Vec::new(),
            description: None,
            metadata: CollectionMetadata::default(),
        }
    }

    /// Sets the collection description
    pub fn with_description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// Adds a request to the collection
    pub fn add_request(mut self, request: Request) -> Self {
        self.requests.push(request);
        self
    }

    /// Sets the collection author
    pub fn with_author(mut self, author: impl Into<String>) -> Self {
        self.metadata.author = Some(author.into());
        self
    }

    /// Returns the number of requests in the collection
    pub fn len(&self) -> usize {
        self.requests.len()
    }

    /// Checks if the collection is empty
    pub fn is_empty(&self) -> bool {
        self.requests.is_empty()
    }

    /// Finds a request by name
    pub fn find_request(&self, name: &str) -> Option<&Request> {
        self.requests.iter().find(|r| r.name == name)
    }
}

impl fmt::Display for Collection {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Collection '{}' ({} request(s))",
            self.name,
            self.requests.len()
        )?;
        if let Some(desc) = &self.description {
            write!(f, ": {}", desc)?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{HttpMethod, Request};

    #[test]
    fn test_collection_creation() {
        let collection = Collection::new("My API Tests");

        assert_eq!(collection.name, "My API Tests");
        assert!(collection.requests.is_empty());
        assert!(collection.description.is_none());
        assert_eq!(collection.metadata.version, Some("1.0.0".to_string()));
    }

    #[test]
    fn test_collection_builder() {
        let request1 = Request::new("Get Users", "https://api.example.com/users");
        let request2 = Request::new("Create User", "https://api.example.com/users")
            .with_method(HttpMethod::Post);

        let collection = Collection::new("User API")
            .with_description("API endpoints for user management")
            .with_author("John Doe")
            .add_request(request1)
            .add_request(request2);

        assert_eq!(collection.name, "User API");
        assert_eq!(
            collection.description,
            Some("API endpoints for user management".to_string())
        );
        assert_eq!(collection.metadata.author, Some("John Doe".to_string()));
        assert_eq!(collection.len(), 2);
        assert!(!collection.is_empty());
    }

    #[test]
    fn test_find_request() {
        let request = Request::new("Test Request", "https://example.com");
        let collection = Collection::new("Test Collection").add_request(request);

        assert!(collection.find_request("Test Request").is_some());
        assert!(collection.find_request("Nonexistent").is_none());
    }

    #[test]
    fn test_collection_serialization() {
        let request =
            Request::new("Get Data", "https://api.example.com/data").with_method(HttpMethod::Get);

        let collection = Collection::new("Test Collection")
            .with_description("A test collection")
            .add_request(request);

        let json = serde_json::to_string(&collection).unwrap();
        assert!(json.contains(r#""name":"Test Collection""#));
        assert!(json.contains(r#""description":"A test collection""#));

        // Test deserialization
        let deserialized: Collection = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.name, "Test Collection");
        assert_eq!(deserialized.len(), 1);
    }

    #[test]
    fn test_collection_display() {
        let collection = Collection::new("My API");
        assert_eq!(collection.to_string(), "Collection 'My API' (0 request(s))");

        let request = Request::new("Test", "https://example.com");
        let collection = Collection::new("My API")
            .with_description("API endpoints for testing")
            .add_request(request);
        assert_eq!(
            collection.to_string(),
            "Collection 'My API' (1 request(s)): API endpoints for testing"
        );
    }
}
