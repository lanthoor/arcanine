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
    use wiremock::matchers::{body_string, header, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn test_http_service_creation() {
        let service = HTTPService::new();
        assert!(service.is_ok());
    }

    #[tokio::test]
    async fn test_get_request() {
        let mock_server = MockServer::start().await;

        Mock::given(method("GET"))
            .and(path("/get"))
            .respond_with(ResponseTemplate::new(200).set_body_string(r#"{"status":"ok"}"#))
            .mount(&mock_server)
            .await;

        let service = HTTPService::new().unwrap();
        let request = Request::new("Test GET", format!("{}/get", mock_server.uri()))
            .with_method(HttpMethod::Get);

        let response = service.execute_request(&request).await;
        assert!(response.is_ok());

        let response = response.unwrap();
        assert!(response.is_success());
        assert_eq!(response.status, 200);
    }

    #[tokio::test]
    async fn test_post_request() {
        let mock_server = MockServer::start().await;

        Mock::given(method("POST"))
            .and(path("/post"))
            .and(header("content-type", "application/json"))
            .and(body_string(r#"{"test": "data"}"#))
            .respond_with(ResponseTemplate::new(200).set_body_string(r#"{"received":true}"#))
            .mount(&mock_server)
            .await;

        let service = HTTPService::new().unwrap();
        let request = Request::new("Test POST", format!("{}/post", mock_server.uri()))
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
        let mock_server = MockServer::start().await;

        Mock::given(method("PUT"))
            .and(path("/put"))
            .and(header("content-type", "application/json"))
            .respond_with(ResponseTemplate::new(200).set_body_string(r#"{"updated":true}"#))
            .mount(&mock_server)
            .await;

        let service = HTTPService::new().unwrap();
        let request = Request::new("Test PUT", format!("{}/put", mock_server.uri()))
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
        let mock_server = MockServer::start().await;

        Mock::given(method("DELETE"))
            .and(path("/delete"))
            .respond_with(ResponseTemplate::new(200).set_body_string(r#"{"deleted":true}"#))
            .mount(&mock_server)
            .await;

        let service = HTTPService::new().unwrap();
        let request = Request::new("Test DELETE", format!("{}/delete", mock_server.uri()))
            .with_method(HttpMethod::Delete);

        let response = service.execute_request(&request).await;
        assert!(response.is_ok());

        let response = response.unwrap();
        assert!(response.is_success());
        assert_eq!(response.status, 200);
    }

    #[tokio::test]
    async fn test_patch_request() {
        let mock_server = MockServer::start().await;

        Mock::given(method("PATCH"))
            .and(path("/patch"))
            .and(header("content-type", "application/json"))
            .respond_with(ResponseTemplate::new(200).set_body_string(r#"{"patched":true}"#))
            .mount(&mock_server)
            .await;

        let service = HTTPService::new().unwrap();
        let request = Request::new("Test PATCH", format!("{}/patch", mock_server.uri()))
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
        let mock_server = MockServer::start().await;

        Mock::given(method("GET"))
            .and(path("/headers"))
            .and(header("x-custom-header", "test-value"))
            .and(header("user-agent", "Arcanine/0.1.0"))
            .respond_with(ResponseTemplate::new(200).set_body_string(
                r#"{"headers":{"X-Custom-Header":"test-value","User-Agent":"Arcanine/0.1.0"}}"#,
            ))
            .mount(&mock_server)
            .await;

        let service = HTTPService::new().unwrap();
        let request = Request::new("Test Headers", format!("{}/headers", mock_server.uri()))
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
        let mock_server = MockServer::start().await;

        Mock::given(method("GET"))
            .and(path("/get"))
            .respond_with(
                ResponseTemplate::new(200)
                    .set_body_string(r#"{"status":"ok"}"#)
                    .insert_header("content-type", "application/json"),
            )
            .mount(&mock_server)
            .await;

        let service = HTTPService::new().unwrap();
        let request = Request::new(
            "Test Response Headers",
            format!("{}/get", mock_server.uri()),
        )
        .with_method(HttpMethod::Get);

        let response = service.execute_request(&request).await.unwrap();

        // Mock server returns content-type header
        assert!(response.headers.contains_key("content-type"));
    }

    #[tokio::test]
    async fn test_response_timing() {
        let mock_server = MockServer::start().await;

        Mock::given(method("GET"))
            .and(path("/delay"))
            .respond_with(
                ResponseTemplate::new(200)
                    .set_body_string(r#"{"delayed":true}"#)
                    .set_delay(std::time::Duration::from_secs(1)),
            )
            .mount(&mock_server)
            .await;

        let service = HTTPService::new().unwrap();
        let request = Request::new("Test Timing", format!("{}/delay", mock_server.uri()))
            .with_method(HttpMethod::Get);

        let response = service.execute_request(&request).await.unwrap();

        // Should take at least 1 second
        assert!(response.response_time.as_secs() >= 1);
    }
}
