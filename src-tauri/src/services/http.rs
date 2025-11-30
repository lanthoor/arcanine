use crate::models::{HttpMethod, Request, Response};
use std::collections::HashMap;
use std::time::{Duration, Instant};

/// HTTP service for executing HTTP requests
pub struct HTTPService {
    client: reqwest::Client,
}

impl HTTPService {
    /// Create a new HTTPService instance
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()?;

        Ok(Self { client })
    }

    /// Execute an HTTP request and return the response
    pub async fn execute_request(
        &self,
        request: &Request,
    ) -> Result<Response, Box<dyn std::error::Error>> {
        let start_time = Instant::now();

        // Build the request based on HTTP method
        let mut req_builder = match request.method {
            HttpMethod::Get => self.client.get(&request.url),
            HttpMethod::Post => self.client.post(&request.url),
            HttpMethod::Put => self.client.put(&request.url),
            HttpMethod::Patch => self.client.patch(&request.url),
            HttpMethod::Delete => self.client.delete(&request.url),
            HttpMethod::Head => self.client.head(&request.url),
            HttpMethod::Options => self.client.request(reqwest::Method::OPTIONS, &request.url),
        };

        // Add headers
        for (key, value) in &request.headers {
            req_builder = req_builder.header(key, value);
        }

        // Add body if present
        if let Some(body) = &request.body {
            req_builder = req_builder.body(body.clone());
        }

        // Execute the request
        let response = req_builder.send().await?;

        // Capture response time
        let response_time = start_time.elapsed();

        // Extract status code
        let status = response.status().as_u16();

        // Extract headers
        let mut headers = HashMap::new();
        for (key, value) in response.headers() {
            if let Ok(value_str) = value.to_str() {
                headers.insert(key.to_string(), value_str.to_string());
            }
        }

        // Extract body
        let body = response.text().await?;

        Ok(Response::new(status, body, response_time).with_headers(headers))
    }
}

impl Default for HTTPService {
    fn default() -> Self {
        Self::new().expect("Failed to create HTTPService")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_http_service_creation() {
        let service = HTTPService::new();
        assert!(service.is_ok());
    }

    #[tokio::test]
    async fn test_get_request() {
        let service = HTTPService::new().unwrap();
        let request =
            Request::new("Test GET", "https://httpbin.org/get").with_method(HttpMethod::Get);

        let response = service.execute_request(&request).await;
        assert!(response.is_ok());

        let response = response.unwrap();
        assert!(response.is_success());
        assert_eq!(response.status, 200);
    }

    #[tokio::test]
    async fn test_post_request() {
        let service = HTTPService::new().unwrap();
        let request = Request::new("Test POST", "https://httpbin.org/post")
            .with_method(HttpMethod::Post)
            .with_header("Content-Type", "application/json")
            .with_body(r#"{"test": "data"}"#);

        let response = service.execute_request(&request).await;
        assert!(response.is_ok());

        let response = response.unwrap();
        assert!(response.is_success());
        assert_eq!(response.status, 200);
    }

    #[tokio::test]
    async fn test_put_request() {
        let service = HTTPService::new().unwrap();
        let request = Request::new("Test PUT", "https://httpbin.org/put")
            .with_method(HttpMethod::Put)
            .with_header("Content-Type", "application/json")
            .with_body(r#"{"test": "data"}"#);

        let response = service.execute_request(&request).await;
        assert!(response.is_ok());

        let response = response.unwrap();
        assert!(response.is_success());
        assert_eq!(response.status, 200);
    }

    #[tokio::test]
    async fn test_delete_request() {
        let service = HTTPService::new().unwrap();
        let request = Request::new("Test DELETE", "https://httpbin.org/delete")
            .with_method(HttpMethod::Delete);

        let response = service.execute_request(&request).await;
        assert!(response.is_ok());

        let response = response.unwrap();
        assert!(response.is_success());
        assert_eq!(response.status, 200);
    }

    #[tokio::test]
    async fn test_patch_request() {
        let service = HTTPService::new().unwrap();
        let request = Request::new("Test PATCH", "https://httpbin.org/patch")
            .with_method(HttpMethod::Patch)
            .with_header("Content-Type", "application/json")
            .with_body(r#"{"test": "data"}"#);

        let response = service.execute_request(&request).await;
        assert!(response.is_ok());

        let response = response.unwrap();
        assert!(response.is_success());
        assert_eq!(response.status, 200);
    }

    #[tokio::test]
    async fn test_request_with_headers() {
        let service = HTTPService::new().unwrap();
        let request = Request::new("Test Headers", "https://httpbin.org/headers")
            .with_method(HttpMethod::Get)
            .with_header("X-Custom-Header", "test-value")
            .with_header("User-Agent", "Arcanine/0.1.0");

        let response = service.execute_request(&request).await;
        assert!(response.is_ok());

        let response = response.unwrap();
        assert!(response.is_success());
        assert!(response.body.contains("X-Custom-Header"));
        assert!(response.body.contains("test-value"));
    }

    #[tokio::test]
    async fn test_response_captures_headers() {
        let service = HTTPService::new().unwrap();
        let request = Request::new("Test Response Headers", "https://httpbin.org/get")
            .with_method(HttpMethod::Get);

        let response = service.execute_request(&request).await.unwrap();

        // httpbin.org returns content-type header
        assert!(response.headers.contains_key("content-type"));
    }

    #[tokio::test]
    async fn test_response_timing() {
        let service = HTTPService::new().unwrap();
        let request =
            Request::new("Test Timing", "https://httpbin.org/delay/1").with_method(HttpMethod::Get);

        let response = service.execute_request(&request).await.unwrap();

        // Should take at least 1 second
        assert!(response.response_time.as_secs() >= 1);
    }
}
