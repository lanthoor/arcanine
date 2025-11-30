use crate::models::Request;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};

/// In-memory request storage with thread-safe concurrent access
#[derive(Debug, Clone)]
pub struct RequestStore {
    /// Internal storage using HashMap with RwLock for thread safety
    /// Key: request name, Value: Request
    store: Arc<RwLock<HashMap<String, Request>>>,
}

impl RequestStore {
    /// Creates a new empty RequestStore
    ///
    /// # Examples
    ///
    /// ```
    /// use arcanine_lib::storage::RequestStore;
    ///
    /// let store = RequestStore::new();
    /// ```
    pub fn new() -> Self {
        Self {
            store: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Returns the number of requests in the store
    ///
    /// # Examples
    ///
    /// ```
    /// use arcanine_lib::storage::RequestStore;
    ///
    /// let store = RequestStore::new();
    /// assert_eq!(store.len(), 0);
    /// ```
    pub fn len(&self) -> usize {
        self.store.read().unwrap().len()
    }

    /// Returns true if the store is empty
    ///
    /// # Examples
    ///
    /// ```
    /// use arcanine_lib::storage::RequestStore;
    ///
    /// let store = RequestStore::new();
    /// assert!(store.is_empty());
    /// ```
    pub fn is_empty(&self) -> bool {
        self.store.read().unwrap().is_empty()
    }

    /// Adds a new request to the store
    ///
    /// # Arguments
    ///
    /// * `name` - Unique name for the request (used as key)
    /// * `request` - The request to store
    ///
    /// # Returns
    ///
    /// * `Ok(())` if the request was added successfully
    /// * `Err(String)` if the name is empty or already exists
    ///
    /// # Examples
    ///
    /// ```
    /// use arcanine_lib::storage::RequestStore;
    /// use arcanine_lib::models::Request;
    ///
    /// let store = RequestStore::new();
    /// let request = Request::new("test", "https://api.example.com");
    /// assert!(store.add_request("test", request).is_ok());
    /// ```
    pub fn add_request(&self, name: &str, request: Request) -> Result<(), String> {
        if name.trim().is_empty() {
            return Err("Request name cannot be empty".to_string());
        }

        let mut store = self.store.write().unwrap();

        if store.contains_key(name) {
            return Err(format!("Request with name '{}' already exists", name));
        }

        store.insert(name.to_string(), request);
        Ok(())
    }

    /// Updates an existing request in the store
    ///
    /// # Arguments
    ///
    /// * `name` - Name of the request to update
    /// * `request` - The new request data
    ///
    /// # Returns
    ///
    /// * `Ok(())` if the request was updated successfully
    /// * `Err(String)` if the request doesn't exist
    ///
    /// # Examples
    ///
    /// ```
    /// use arcanine_lib::storage::RequestStore;
    /// use arcanine_lib::models::{Request, HttpMethod};
    ///
    /// let store = RequestStore::new();
    /// let request1 = Request::new("test", "https://api.example.com");
    /// store.add_request("test", request1).unwrap();
    ///
    /// let request2 = Request::new("test", "https://api.example.com/data")
    ///     .with_method(HttpMethod::Post);
    /// assert!(store.update_request("test", request2).is_ok());
    /// ```
    pub fn update_request(&self, name: &str, request: Request) -> Result<(), String> {
        let mut store = self.store.write().unwrap();

        if !store.contains_key(name) {
            return Err(format!("Request with name '{}' not found", name));
        }

        store.insert(name.to_string(), request);
        Ok(())
    }

    /// Deletes a request from the store
    ///
    /// # Arguments
    ///
    /// * `name` - Name of the request to delete
    ///
    /// # Returns
    ///
    /// * `Ok(())` if the request was deleted successfully
    /// * `Err(String)` if the request doesn't exist
    ///
    /// # Examples
    ///
    /// ```
    /// use arcanine_lib::storage::RequestStore;
    /// use arcanine_lib::models::Request;
    ///
    /// let store = RequestStore::new();
    /// let request = Request::new("test", "https://api.example.com");
    /// store.add_request("test", request).unwrap();
    /// assert!(store.delete_request("test").is_ok());
    /// assert!(store.is_empty());
    /// ```
    pub fn delete_request(&self, name: &str) -> Result<(), String> {
        let mut store = self.store.write().unwrap();

        if store.remove(name).is_none() {
            return Err(format!("Request with name '{}' not found", name));
        }

        Ok(())
    }

    /// Retrieves a request by name
    ///
    /// # Arguments
    ///
    /// * `name` - Name of the request to retrieve
    ///
    /// # Returns
    ///
    /// * `Some(Request)` if the request exists
    /// * `None` if the request doesn't exist
    ///
    /// # Examples
    ///
    /// ```
    /// use arcanine_lib::storage::RequestStore;
    /// use arcanine_lib::models::Request;
    ///
    /// let store = RequestStore::new();
    /// let request = Request::new("test", "https://api.example.com");
    /// store.add_request("test", request).unwrap();
    /// assert!(store.get_request("test").is_some());
    /// ```
    pub fn get_request(&self, name: &str) -> Option<Request> {
        let store = self.store.read().unwrap();
        store.get(name).cloned()
    }

    /// Retrieves all requests from the store
    ///
    /// # Returns
    ///
    /// A vector of tuples containing (name, request) pairs
    ///
    /// # Examples
    ///
    /// ```
    /// use arcanine_lib::storage::RequestStore;
    /// use arcanine_lib::models::{Request, HttpMethod};
    ///
    /// let store = RequestStore::new();
    /// let request1 = Request::new("get_req", "https://api.example.com");
    /// let request2 = Request::new("post_req", "https://api.example.com/data")
    ///     .with_method(HttpMethod::Post);
    /// store.add_request("get_req", request1).unwrap();
    /// store.add_request("post_req", request2).unwrap();
    ///
    /// let all = store.get_all_requests();
    /// assert_eq!(all.len(), 2);
    /// ```
    pub fn get_all_requests(&self) -> Vec<(String, Request)> {
        let store = self.store.read().unwrap();
        store.iter().map(|(k, v)| (k.clone(), v.clone())).collect()
    }

    /// Checks if a request with the given name exists
    ///
    /// # Arguments
    ///
    /// * `name` - Name to check
    ///
    /// # Returns
    ///
    /// `true` if a request with that name exists, `false` otherwise
    pub fn contains(&self, name: &str) -> bool {
        let store = self.store.read().unwrap();
        store.contains_key(name)
    }

    /// Clears all requests from the store
    ///
    /// # Examples
    ///
    /// ```
    /// use arcanine_lib::storage::RequestStore;
    /// use arcanine_lib::models::Request;
    ///
    /// let store = RequestStore::new();
    /// let request = Request::new("test", "https://api.example.com");
    /// store.add_request("test", request).unwrap();
    /// store.clear();
    /// assert!(store.is_empty());
    /// ```
    pub fn clear(&self) {
        let mut store = self.store.write().unwrap();
        store.clear();
    }
}

impl Default for RequestStore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::HttpMethod;

    #[test]
    fn test_new_store_is_empty() {
        let store = RequestStore::new();
        assert!(store.is_empty());
        assert_eq!(store.len(), 0);
    }

    #[test]
    fn test_default() {
        let store = RequestStore::default();
        assert!(store.is_empty());
    }

    #[test]
    fn test_clone() {
        let store1 = RequestStore::new();
        let store2 = store1.clone();

        // Both should be empty
        assert!(store1.is_empty());
        assert!(store2.is_empty());

        // They should share the same underlying storage (Arc)
        assert_eq!(store1.len(), store2.len());
    }

    #[test]
    fn test_add_request_success() {
        let store = RequestStore::new();
        let request = Request::new("test_request", "https://api.example.com");

        assert!(store.add_request("test_request", request).is_ok());
        assert_eq!(store.len(), 1);
        assert!(!store.is_empty());
    }

    #[test]
    fn test_add_request_empty_name() {
        let store = RequestStore::new();
        let request = Request::new("test", "https://api.example.com");

        let result = store.add_request("", request);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Request name cannot be empty");
        assert!(store.is_empty());
    }

    #[test]
    fn test_add_request_whitespace_name() {
        let store = RequestStore::new();
        let request = Request::new("test", "https://api.example.com");

        let result = store.add_request("   ", request);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Request name cannot be empty");
    }

    #[test]
    fn test_add_duplicate_request() {
        let store = RequestStore::new();
        let request1 = Request::new("duplicate", "https://api.example.com");
        let request2 =
            Request::new("duplicate", "https://api.example.com/data").with_method(HttpMethod::Post);

        store.add_request("duplicate", request1).unwrap();
        let result = store.add_request("duplicate", request2);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("already exists"));
        assert_eq!(store.len(), 1);
    }

    #[test]
    fn test_update_request_success() {
        let store = RequestStore::new();
        let request1 = Request::new("test", "https://api.example.com");
        store.add_request("test", request1).unwrap();

        let request2 =
            Request::new("test", "https://api.example.com/update").with_method(HttpMethod::Post);
        assert!(store.update_request("test", request2).is_ok());

        let retrieved = store.get_request("test").unwrap();
        assert_eq!(retrieved.method, HttpMethod::Post);
        assert_eq!(retrieved.url, "https://api.example.com/update");
    }

    #[test]
    fn test_update_nonexistent_request() {
        let store = RequestStore::new();
        let request = Request::new("nonexistent", "https://api.example.com");

        let result = store.update_request("nonexistent", request);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_delete_request_success() {
        let store = RequestStore::new();
        let request = Request::new("to_delete", "https://api.example.com");
        store.add_request("to_delete", request).unwrap();

        assert_eq!(store.len(), 1);
        assert!(store.delete_request("to_delete").is_ok());
        assert_eq!(store.len(), 0);
        assert!(store.is_empty());
    }

    #[test]
    fn test_delete_nonexistent_request() {
        let store = RequestStore::new();

        let result = store.delete_request("nonexistent");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_get_request_success() {
        let store = RequestStore::new();
        let request = Request::new("test", "https://api.example.com");
        store.add_request("test", request.clone()).unwrap();

        let retrieved = store.get_request("test");
        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.method, request.method);
        assert_eq!(retrieved.url, request.url);
    }

    #[test]
    fn test_get_nonexistent_request() {
        let store = RequestStore::new();
        assert!(store.get_request("nonexistent").is_none());
    }

    #[test]
    fn test_get_all_requests() {
        let store = RequestStore::new();
        let request1 = Request::new("req1", "https://api.example.com/1");
        let request2 =
            Request::new("req2", "https://api.example.com/2").with_method(HttpMethod::Post);
        let request3 =
            Request::new("req3", "https://api.example.com/3").with_method(HttpMethod::Put);

        store.add_request("req1", request1).unwrap();
        store.add_request("req2", request2).unwrap();
        store.add_request("req3", request3).unwrap();

        let all = store.get_all_requests();
        assert_eq!(all.len(), 3);

        // Verify all names are present
        let names: Vec<String> = all.iter().map(|(name, _)| name.clone()).collect();
        assert!(names.contains(&"req1".to_string()));
        assert!(names.contains(&"req2".to_string()));
        assert!(names.contains(&"req3".to_string()));
    }

    #[test]
    fn test_get_all_requests_empty() {
        let store = RequestStore::new();
        let all = store.get_all_requests();
        assert_eq!(all.len(), 0);
    }

    #[test]
    fn test_contains() {
        let store = RequestStore::new();
        let request = Request::new("test", "https://api.example.com");

        assert!(!store.contains("test"));
        store.add_request("test", request).unwrap();
        assert!(store.contains("test"));
    }

    #[test]
    fn test_clear() {
        let store = RequestStore::new();
        let request1 = Request::new("req1", "https://api.example.com/1");
        let request2 =
            Request::new("req2", "https://api.example.com/2").with_method(HttpMethod::Post);

        store.add_request("req1", request1).unwrap();
        store.add_request("req2", request2).unwrap();
        assert_eq!(store.len(), 2);

        store.clear();
        assert!(store.is_empty());
        assert_eq!(store.len(), 0);
    }

    #[test]
    fn test_concurrent_access_shared_store() {
        use std::thread;

        let store = RequestStore::new();
        let store_clone = store.clone();

        // Add request in one thread
        let handle = thread::spawn(move || {
            let request = Request::new("concurrent", "https://api.example.com");
            store_clone.add_request("concurrent", request).unwrap();
        });

        handle.join().unwrap();

        // Verify in main thread
        assert_eq!(store.len(), 1);
        assert!(store.contains("concurrent"));
    }

    #[test]
    fn test_multiple_operations() {
        let store = RequestStore::new();

        // Add multiple requests
        for i in 0..10 {
            let request = Request::new(
                format!("req{}", i),
                format!("https://api.example.com/{}", i),
            );
            store.add_request(&format!("req{}", i), request).unwrap();
        }
        assert_eq!(store.len(), 10);

        // Update some
        for i in 0..5 {
            let request = Request::new(
                format!("req{}", i),
                format!("https://api.example.com/updated/{}", i),
            )
            .with_method(HttpMethod::Post);
            store.update_request(&format!("req{}", i), request).unwrap();
        }

        // Delete some
        for i in 5..10 {
            store.delete_request(&format!("req{}", i)).unwrap();
        }
        assert_eq!(store.len(), 5);

        // Verify remaining are updated ones
        for i in 0..5 {
            let retrieved = store.get_request(&format!("req{}", i)).unwrap();
            assert_eq!(retrieved.method, HttpMethod::Post);
            assert!(retrieved.url.contains("updated"));
        }
    }

    #[test]
    fn test_request_with_headers_and_body() {
        let store = RequestStore::new();
        let request = Request::new("complex", "https://api.example.com")
            .with_method(HttpMethod::Post)
            .with_header("Content-Type", "application/json")
            .with_header("Authorization", "Bearer token123")
            .with_body("{ \"data\": \"test\" }");

        store.add_request("complex", request.clone()).unwrap();

        let retrieved = store.get_request("complex").unwrap();
        assert_eq!(retrieved.headers.len(), 2);
        assert_eq!(
            retrieved.headers.get("Content-Type").unwrap(),
            "application/json"
        );
        assert_eq!(
            retrieved.headers.get("Authorization").unwrap(),
            "Bearer token123"
        );
        assert_eq!(retrieved.body, Some("{ \"data\": \"test\" }".to_string()));
    }
}
