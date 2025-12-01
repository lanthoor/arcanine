use crate::models::{Collection, Request};
use serde::Serialize;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

/// Error type for YAML storage operations
#[derive(Debug, thiserror::Error)]
pub enum YAMLStoreError {
    #[error("Failed to read file: {0}")]
    ReadError(#[from] std::io::Error),

    #[error("Failed to serialize YAML: {0}")]
    SerializeError(#[from] serde_yaml::Error),

    #[error("File not found: {0}")]
    FileNotFound(PathBuf),

    #[error("Invalid file path")]
    InvalidPath,

    #[error("Validation error: {0}")]
    ValidationError(String),
}

pub type YAMLStoreResult<T> = Result<T, YAMLStoreError>;

/// YAML-based file storage for requests and collections
pub struct YAMLStore {
    base_path: PathBuf,
}

impl YAMLStore {
    /// Create a new YAML store with the specified base directory
    pub fn new<P: AsRef<Path>>(base_path: P) -> YAMLStoreResult<Self> {
        let base_path = base_path.as_ref().to_path_buf();

        // Create base directory if it doesn't exist
        if !base_path.exists() {
            fs::create_dir_all(&base_path)?;
        }

        Ok(Self { base_path })
    }

    /// Save a request to a YAML file
    ///
    /// # Arguments
    /// * `request` - The request to save
    /// * `filename` - The name of the file (without extension)
    ///
    /// # Returns
    /// The full path to the saved file
    pub fn save_request(&self, request: &Request, filename: &str) -> YAMLStoreResult<PathBuf> {
        let file_path = self.base_path.join(format!("{}.request.yaml", filename));
        self.save_yaml(&file_path, request)?;
        Ok(file_path)
    }

    /// Load a request from a YAML file
    pub fn load_request<P: AsRef<Path>>(&self, file_path: P) -> YAMLStoreResult<Request> {
        let full_path = self.resolve_path(file_path)?;

        if !full_path.exists() {
            return Err(YAMLStoreError::FileNotFound(full_path));
        }

        let contents = fs::read_to_string(&full_path)?;
        let request: Request = serde_yaml::from_str(&contents)?;

        // Validate the loaded request
        request
            .validate()
            .map_err(|e| YAMLStoreError::ValidationError(e.to_string()))?;

        Ok(request)
    }

    /// Save a collection to a YAML file
    pub fn save_collection(
        &self,
        collection: &Collection,
        filename: &str,
    ) -> YAMLStoreResult<PathBuf> {
        let file_path = self.base_path.join(format!("{}.collection.yaml", filename));
        self.save_yaml(&file_path, collection)?;
        Ok(file_path)
    }

    /// Load a collection from a YAML file
    pub fn load_collection<P: AsRef<Path>>(&self, file_path: P) -> YAMLStoreResult<Collection> {
        let full_path = self.resolve_path(file_path)?;

        if !full_path.exists() {
            return Err(YAMLStoreError::FileNotFound(full_path));
        }

        let contents = fs::read_to_string(&full_path)?;
        let collection: Collection = serde_yaml::from_str(&contents)?;

        Ok(collection)
    }

    /// Delete a file
    pub fn delete_file<P: AsRef<Path>>(&self, file_path: P) -> YAMLStoreResult<()> {
        let full_path = self.resolve_path(file_path)?;

        if !full_path.exists() {
            return Err(YAMLStoreError::FileNotFound(full_path));
        }

        fs::remove_file(full_path)?;
        Ok(())
    }

    /// List all request files in the base directory
    pub fn list_request_files(&self) -> YAMLStoreResult<Vec<PathBuf>> {
        self.list_files_with_extension("request.yaml")
    }

    /// List all collection files in the base directory
    pub fn list_collection_files(&self) -> YAMLStoreResult<Vec<PathBuf>> {
        self.list_files_with_extension("collection.yaml")
    }

    // Private helper methods

    /// Save any serializable data to a YAML file with atomic write
    fn save_yaml<T: Serialize, P: AsRef<Path>>(
        &self,
        file_path: P,
        data: &T,
    ) -> YAMLStoreResult<()> {
        let file_path = file_path.as_ref();

        // Ensure parent directory exists
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent)?;
        }

        // Serialize to YAML
        let yaml_content = serde_yaml::to_string(data)?;

        // Atomic write: write to temporary file first
        let temp_path = file_path.with_extension("yaml.tmp");
        let mut temp_file = fs::File::create(&temp_path)?;
        temp_file.write_all(yaml_content.as_bytes())?;
        temp_file.sync_all()?; // Ensure data is written to disk

        // Atomically rename temp file to final file
        fs::rename(&temp_path, file_path)?;

        Ok(())
    }

    /// Resolve a path relative to the base directory
    fn resolve_path<P: AsRef<Path>>(&self, file_path: P) -> YAMLStoreResult<PathBuf> {
        let path = file_path.as_ref();

        // If path is absolute or already contains base_path, use it as-is
        if path.is_absolute() {
            Ok(path.to_path_buf())
        } else {
            Ok(self.base_path.join(path))
        }
    }

    /// List all files with a specific extension
    fn list_files_with_extension(&self, extension: &str) -> YAMLStoreResult<Vec<PathBuf>> {
        if !self.base_path.exists() {
            return Ok(Vec::new());
        }

        let mut files = Vec::new();

        for entry in fs::read_dir(&self.base_path)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_file() {
                if let Some(file_name) = path.file_name() {
                    if file_name.to_string_lossy().ends_with(extension) {
                        files.push(path);
                    }
                }
            }
        }

        Ok(files)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::HttpMethod;
    use tempfile::TempDir;

    fn create_test_request() -> Request {
        Request::new("test-request", "https://api.example.com/users")
            .with_method(HttpMethod::Get)
            .with_header("Authorization", "Bearer token123")
    }

    fn create_test_collection() -> Collection {
        Collection::new("Test Collection")
            .with_description("A test collection for unit tests")
            .add_request(create_test_request())
    }

    #[test]
    fn test_new_creates_directory() {
        let temp_dir = TempDir::new().unwrap();
        let store_path = temp_dir.path().join("new_store");

        assert!(!store_path.exists());
        let _store = YAMLStore::new(&store_path).unwrap();
        assert!(store_path.exists());
    }

    #[test]
    fn test_save_and_load_request() {
        let temp_dir = TempDir::new().unwrap();
        let store = YAMLStore::new(temp_dir.path()).unwrap();

        let request = create_test_request();
        let saved_path = store.save_request(&request, "test").unwrap();

        assert!(saved_path.exists());
        assert_eq!(saved_path.file_name().unwrap(), "test.request.yaml");

        let loaded = store.load_request(&saved_path).unwrap();
        assert_eq!(loaded.name, request.name);
        assert_eq!(loaded.method, request.method);
        assert_eq!(loaded.url, request.url);
    }

    #[test]
    fn test_save_and_load_collection() {
        let temp_dir = TempDir::new().unwrap();
        let store = YAMLStore::new(temp_dir.path()).unwrap();

        let collection = create_test_collection();
        let saved_path = store
            .save_collection(&collection, "test-collection")
            .unwrap();

        assert!(saved_path.exists());
        assert_eq!(
            saved_path.file_name().unwrap(),
            "test-collection.collection.yaml"
        );

        let loaded = store.load_collection(&saved_path).unwrap();
        assert_eq!(loaded.name, collection.name);
        assert_eq!(loaded.description, collection.description);
        assert_eq!(loaded.requests.len(), collection.requests.len());
    }

    #[test]
    fn test_load_nonexistent_file() {
        let temp_dir = TempDir::new().unwrap();
        let store = YAMLStore::new(temp_dir.path()).unwrap();

        let result = store.load_request("nonexistent.request.yaml");
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            YAMLStoreError::FileNotFound(_)
        ));
    }

    #[test]
    fn test_load_malformed_yaml() {
        let temp_dir = TempDir::new().unwrap();
        let store = YAMLStore::new(temp_dir.path()).unwrap();

        let malformed_path = temp_dir.path().join("malformed.request.yaml");
        fs::write(&malformed_path, "invalid: yaml: content: [").unwrap();

        let result = store.load_request(&malformed_path);
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            YAMLStoreError::SerializeError(_)
        ));
    }

    #[test]
    fn test_delete_file() {
        let temp_dir = TempDir::new().unwrap();
        let store = YAMLStore::new(temp_dir.path()).unwrap();

        let request = create_test_request();
        let saved_path = store.save_request(&request, "to-delete").unwrap();
        assert!(saved_path.exists());

        store.delete_file(&saved_path).unwrap();
        assert!(!saved_path.exists());
    }

    #[test]
    fn test_delete_nonexistent_file() {
        let temp_dir = TempDir::new().unwrap();
        let store = YAMLStore::new(temp_dir.path()).unwrap();

        let result = store.delete_file("nonexistent.request.yaml");
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            YAMLStoreError::FileNotFound(_)
        ));
    }

    #[test]
    fn test_list_request_files() {
        let temp_dir = TempDir::new().unwrap();
        let store = YAMLStore::new(temp_dir.path()).unwrap();

        // Initially empty
        let files = store.list_request_files().unwrap();
        assert_eq!(files.len(), 0);

        // Add some request files
        store.save_request(&create_test_request(), "req1").unwrap();
        store.save_request(&create_test_request(), "req2").unwrap();
        store
            .save_collection(&create_test_collection(), "col1")
            .unwrap();

        let files = store.list_request_files().unwrap();
        assert_eq!(files.len(), 2);
    }

    #[test]
    fn test_list_collection_files() {
        let temp_dir = TempDir::new().unwrap();
        let store = YAMLStore::new(temp_dir.path()).unwrap();

        store.save_request(&create_test_request(), "req1").unwrap();
        store
            .save_collection(&create_test_collection(), "col1")
            .unwrap();
        store
            .save_collection(&create_test_collection(), "col2")
            .unwrap();

        let files = store.list_collection_files().unwrap();
        assert_eq!(files.len(), 2);
    }

    #[test]
    fn test_atomic_write() {
        let temp_dir = TempDir::new().unwrap();
        let store = YAMLStore::new(temp_dir.path()).unwrap();

        let request = create_test_request();
        let file_path = store.save_request(&request, "atomic-test").unwrap();

        // Verify no .tmp file remains
        let temp_path = file_path.with_extension("yaml.tmp");
        assert!(!temp_path.exists());

        // Verify the actual file exists and is valid
        assert!(file_path.exists());
        let loaded = store.load_request(&file_path).unwrap();
        assert_eq!(loaded.name, request.name);
    }

    #[test]
    fn test_invalid_request_validation() {
        let temp_dir = TempDir::new().unwrap();
        let store = YAMLStore::new(temp_dir.path()).unwrap();

        // Create a YAML file with invalid data (empty URL)
        let invalid_yaml = r#"
name: Test Request
method: GET
url: ""
headers: {}
body: null
"#;
        let invalid_path = temp_dir.path().join("invalid.request.yaml");
        fs::write(&invalid_path, invalid_yaml).unwrap();

        let result = store.load_request(&invalid_path);
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            YAMLStoreError::ValidationError(_)
        ));
    }

    #[test]
    fn test_yaml_format_readability() {
        let temp_dir = TempDir::new().unwrap();
        let store = YAMLStore::new(temp_dir.path()).unwrap();

        let request = create_test_request();
        let file_path = store.save_request(&request, "readable").unwrap();

        let content = fs::read_to_string(&file_path).unwrap();

        // Verify YAML contains expected fields
        assert!(content.contains("name:"));
        assert!(content.contains("method:"));
        assert!(content.contains("url:"));
        assert!(content.contains("https://api.example.com/users"));
    }

    #[test]
    fn test_concurrent_saves() {
        use std::sync::Arc;
        use std::thread;

        let temp_dir = TempDir::new().unwrap();
        let store = Arc::new(YAMLStore::new(temp_dir.path()).unwrap());

        let mut handles = vec![];

        for i in 0..5 {
            let store_clone = Arc::clone(&store);
            let handle = thread::spawn(move || {
                let request = create_test_request();
                store_clone.save_request(&request, &format!("concurrent-{}", i))
            });
            handles.push(handle);
        }

        for handle in handles {
            handle.join().unwrap().unwrap();
        }

        let files = store.list_request_files().unwrap();
        assert_eq!(files.len(), 5);
    }

    #[test]
    fn test_benchmark_save_performance() {
        let temp_dir = TempDir::new().unwrap();
        let store = YAMLStore::new(temp_dir.path()).unwrap();

        let request = create_test_request();
        let start = std::time::Instant::now();

        for i in 0..100 {
            store
                .save_request(&request, &format!("perf-test-{}", i))
                .unwrap();
        }

        let duration = start.elapsed();
        println!("100 saves took: {:?}", duration);
        println!("Average per save: {:?}", duration / 100);

        // Ensure it's reasonably fast (should be < 1 second for 100 saves)
        assert!(duration.as_secs() < 1);
    }

    #[test]
    fn test_benchmark_load_performance() {
        let temp_dir = TempDir::new().unwrap();
        let store = YAMLStore::new(temp_dir.path()).unwrap();

        let request = create_test_request();
        let file_path = store.save_request(&request, "load-perf").unwrap();

        let start = std::time::Instant::now();

        for _ in 0..100 {
            let _loaded = store.load_request(&file_path).unwrap();
        }

        let duration = start.elapsed();
        println!("100 loads took: {:?}", duration);
        println!("Average per load: {:?}", duration / 100);

        // Ensure it's reasonably fast
        assert!(duration.as_secs() < 1);
    }
}
