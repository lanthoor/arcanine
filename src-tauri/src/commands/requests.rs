use crate::models::{Request, Response};
use crate::services::http::HTTPService;
use crate::storage::request_store::RequestStore;
use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as TokioMutex;

/// Execute an HTTP request
///
/// # Arguments
///
/// * `request` - The HTTP request to execute
/// * `http_service` - Shared HTTP service instance
///
/// # Returns
///
/// The HTTP response or an error message
#[tauri::command]
pub async fn execute_request(
    request: Request,
    http_service: tauri::State<'_, Arc<TokioMutex<HTTPService>>>,
) -> Result<Response, String> {
    execute_request_impl(request, &http_service).await
}

/// Implementation of execute_request (for testing)
pub async fn execute_request_impl(
    request: Request,
    http_service: &Arc<TokioMutex<HTTPService>>,
) -> Result<Response, String> {
    // Validate the request
    request.validate().map_err(|e| e.to_string())?;

    // Get the HTTP service
    let service = http_service.lock().await;

    // Execute the request
    service
        .execute_request(&request)
        .await
        .map_err(|e| e.to_string())
}

/// Save a request to the store
///
/// # Arguments
///
/// * `request` - The request to save
/// * `store` - Shared request store instance
///
/// # Returns
///
/// Ok(()) on success or an error message
#[tauri::command]
pub fn save_request(
    request: Request,
    store: tauri::State<'_, Arc<Mutex<RequestStore>>>,
) -> Result<(), String> {
    save_request_impl(request, &store)
}

/// Implementation of save_request (for testing)
pub fn save_request_impl(request: Request, store: &Arc<Mutex<RequestStore>>) -> Result<(), String> {
    // Validate the request
    request.validate().map_err(|e| e.to_string())?;

    // Clone the name before moving request
    let name = request.name.clone();

    // Get the store
    let store = store
        .lock()
        .map_err(|e| format!("Failed to lock request store: {}", e))?;

    // Save the request
    store.add_request(&name, request).map_err(|e| e.to_string())
}

/// List all saved requests
///
/// # Arguments
///
/// * `store` - Shared request store instance
///
/// # Returns
///
/// Vector of all saved requests or an error message
#[tauri::command]
pub fn list_requests(
    store: tauri::State<'_, Arc<Mutex<RequestStore>>>,
) -> Result<Vec<Request>, String> {
    list_requests_impl(&store)
}

/// Implementation of list_requests (for testing)
pub fn list_requests_impl(store: &Arc<Mutex<RequestStore>>) -> Result<Vec<Request>, String> {
    // Get the store
    let store = store
        .lock()
        .map_err(|e| format!("Failed to lock request store: {}", e))?;

    // Get all requests (extract just the Request from (String, Request) tuples)
    Ok(store
        .get_all_requests()
        .into_iter()
        .map(|(_, request)| request)
        .collect())
}

/// Delete a request from the store
///
/// # Arguments
///
/// * `name` - Name of the request to delete
/// * `store` - Shared request store instance
///
/// # Returns
///
/// Ok(()) on success or an error message
#[tauri::command]
pub fn delete_request(
    name: String,
    store: tauri::State<'_, Arc<Mutex<RequestStore>>>,
) -> Result<(), String> {
    delete_request_impl(name, &store)
}

/// Implementation of delete_request (for testing)
pub fn delete_request_impl(name: String, store: &Arc<Mutex<RequestStore>>) -> Result<(), String> {
    // Validate name is not empty
    if name.trim().is_empty() {
        return Err("Request name cannot be empty".to_string());
    }

    // Get the store
    let store = store
        .lock()
        .map_err(|e| format!("Failed to lock request store: {}", e))?;

    // Delete the request
    store.delete_request(&name).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::HttpMethod;
    use std::collections::HashMap;

    fn create_test_request() -> Request {
        Request {
            name: "Test Request".to_string(),
            method: HttpMethod::Get,
            url: "https://httpbin.org/get".to_string(),
            headers: HashMap::new(),
            body: None,
        }
    }

    #[tokio::test]
    async fn test_execute_request_success() {
        let service = Arc::new(TokioMutex::new(
            HTTPService::new().expect("Failed to create HTTP service"),
        ));
        let request = create_test_request();

        let result = execute_request_impl(request, &service).await;

        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.status >= 200 && response.status < 300);
    }

    #[tokio::test]
    async fn test_execute_request_invalid_url() {
        let service = Arc::new(TokioMutex::new(
            HTTPService::new().expect("Failed to create HTTP service"),
        ));
        let mut request = create_test_request();
        request.url = "invalid-url".to_string();

        let result = execute_request_impl(request, &service).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid URL"));
    }

    #[test]
    fn test_save_request_success() {
        let store = Arc::new(Mutex::new(RequestStore::new()));
        let request = create_test_request();

        let result = save_request_impl(request, &store);

        assert!(result.is_ok());

        // Verify it was saved
        let store = store.lock().unwrap();
        assert_eq!(store.len(), 1);
    }

    #[test]
    fn test_save_request_invalid() {
        let store = Arc::new(Mutex::new(RequestStore::new()));
        let mut request = create_test_request();
        request.name = "".to_string(); // Invalid empty name

        let result = save_request_impl(request, &store);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("empty"));
    }

    #[test]
    fn test_save_request_duplicate() {
        let store = Arc::new(Mutex::new(RequestStore::new()));
        let request = create_test_request();

        // Save once
        let result1 = save_request_impl(request.clone(), &store);
        assert!(result1.is_ok());

        // Try to save again with same name
        let result2 = save_request_impl(request, &store);
        assert!(result2.is_err());
        assert!(result2.unwrap_err().contains("already exists"));
    }

    #[test]
    fn test_list_requests_empty() {
        let store = Arc::new(Mutex::new(RequestStore::new()));

        let result = list_requests_impl(&store);

        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);
    }

    #[test]
    fn test_list_requests_multiple() {
        let store = Arc::new(Mutex::new(RequestStore::new()));

        // Add multiple requests
        let mut req1 = create_test_request();
        req1.name = "Request 1".to_string();
        save_request_impl(req1, &store).unwrap();

        let mut req2 = create_test_request();
        req2.name = "Request 2".to_string();
        save_request_impl(req2, &store).unwrap();

        let result = list_requests_impl(&store);

        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 2);
    }

    #[test]
    fn test_delete_request_success() {
        let store = Arc::new(Mutex::new(RequestStore::new()));
        let request = create_test_request();
        let name = request.name.clone();

        // Save first
        save_request_impl(request, &store).unwrap();

        // Delete
        let result = delete_request_impl(name, &store);

        assert!(result.is_ok());

        // Verify it was deleted
        let store = store.lock().unwrap();
        assert_eq!(store.len(), 0);
    }

    #[test]
    fn test_delete_request_not_found() {
        let store = Arc::new(Mutex::new(RequestStore::new()));

        let result = delete_request_impl("NonExistent".to_string(), &store);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_delete_request_empty_name() {
        let store = Arc::new(Mutex::new(RequestStore::new()));

        let result = delete_request_impl("".to_string(), &store);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("cannot be empty"));
    }

    #[tokio::test]
    async fn test_concurrent_execute_requests() {
        let service = Arc::new(TokioMutex::new(
            HTTPService::new().expect("Failed to create HTTP service"),
        ));

        // Create multiple requests
        let requests: Vec<Request> = (0..5)
            .map(|i| {
                let mut req = create_test_request();
                req.name = format!("Request {}", i);
                req
            })
            .collect();

        // Execute them concurrently
        let handles: Vec<_> = requests
            .into_iter()
            .map(|req| {
                let service_clone = Arc::clone(&service);
                tokio::spawn(async move { execute_request_impl(req, &service_clone).await })
            })
            .collect();

        // Wait for all to complete
        let results: Vec<_> = futures::future::join_all(handles).await;

        // All should succeed
        for result in results {
            assert!(result.is_ok());
            assert!(result.unwrap().is_ok());
        }
    }

    #[test]
    fn test_concurrent_save_requests() {
        use std::thread;

        let store = Arc::new(Mutex::new(RequestStore::new()));
        let mut handles = vec![];

        // Create 10 threads trying to save different requests
        for i in 0..10 {
            let store_clone = Arc::clone(&store);
            let handle = thread::spawn(move || {
                let mut req = create_test_request();
                req.name = format!("Request {}", i);
                save_request_impl(req, &store_clone)
            });
            handles.push(handle);
        }

        // Wait for all threads
        let results: Vec<_> = handles.into_iter().map(|h| h.join().unwrap()).collect();

        // All should succeed
        for result in results {
            assert!(result.is_ok());
        }

        // Verify all 10 were saved
        let store = store.lock().unwrap();
        assert_eq!(store.len(), 10);
    }

    #[test]
    fn test_concurrent_delete_requests() {
        use std::thread;

        let store = Arc::new(Mutex::new(RequestStore::new()));

        // Pre-populate with 10 requests
        for i in 0..10 {
            let mut req = create_test_request();
            req.name = format!("Request {}", i);
            save_request_impl(req, &store).unwrap();
        }

        let mut handles = vec![];

        // Create 10 threads trying to delete different requests
        for i in 0..10 {
            let store_clone = Arc::clone(&store);
            let handle =
                thread::spawn(move || delete_request_impl(format!("Request {}", i), &store_clone));
            handles.push(handle);
        }

        // Wait for all threads
        let results: Vec<_> = handles.into_iter().map(|h| h.join().unwrap()).collect();

        // All should succeed
        for result in results {
            assert!(result.is_ok());
        }

        // Verify all were deleted
        let store = store.lock().unwrap();
        assert_eq!(store.len(), 0);
    }

    #[tokio::test]
    async fn test_integration_save_execute_list_delete() {
        // Setup
        let http_service = Arc::new(TokioMutex::new(
            HTTPService::new().expect("Failed to create HTTP service"),
        ));
        let store = Arc::new(Mutex::new(RequestStore::new()));

        // 1. Save a request
        let request = create_test_request();
        save_request_impl(request.clone(), &store).unwrap();

        // 2. List requests and verify
        let requests = list_requests_impl(&store).unwrap();
        assert_eq!(requests.len(), 1);
        assert_eq!(requests[0].name, "Test Request");

        // 3. Execute the request
        let response = execute_request_impl(request.clone(), &http_service)
            .await
            .unwrap();
        assert!(response.status >= 200 && response.status < 300);

        // 4. Save another request
        let mut request2 = create_test_request();
        request2.name = "Test Request 2".to_string();
        save_request_impl(request2, &store).unwrap();

        // 5. List again
        let requests = list_requests_impl(&store).unwrap();
        assert_eq!(requests.len(), 2);

        // 6. Delete first request
        delete_request_impl("Test Request".to_string(), &store).unwrap();

        // 7. Verify deletion
        let requests = list_requests_impl(&store).unwrap();
        assert_eq!(requests.len(), 1);
        assert_eq!(requests[0].name, "Test Request 2");
    }

    #[tokio::test]
    async fn test_integration_error_handling() {
        let http_service = Arc::new(TokioMutex::new(
            HTTPService::new().expect("Failed to create HTTP service"),
        ));
        let store = Arc::new(Mutex::new(RequestStore::new()));

        // Test invalid URL in execute
        let mut bad_request = create_test_request();
        bad_request.url = "not-a-url".to_string();
        let result = execute_request_impl(bad_request, &http_service).await;
        assert!(result.is_err());

        // Test invalid name in save
        let mut bad_request = create_test_request();
        bad_request.name = "".to_string();
        let result = save_request_impl(bad_request, &store);
        assert!(result.is_err());

        // Test delete non-existent
        let result = delete_request_impl("NonExistent".to_string(), &store);
        assert!(result.is_err());

        // Store should still be empty
        let requests = list_requests_impl(&store).unwrap();
        assert_eq!(requests.len(), 0);
    }
}
