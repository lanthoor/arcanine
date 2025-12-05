use crate::models::{Collection, Request};
use crate::storage::{YAMLStore, YAMLStoreResult};
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};
use std::time::Duration;

/// Directory structure constants for organizing collections
pub mod constants {
    /// Default directory for storing collections
    pub const COLLECTIONS_DIR: &str = "collections";

    /// Subdirectory for individual request files
    pub const REQUESTS_DIR: &str = "requests";

    /// File extension for collection files
    pub const COLLECTION_EXT: &str = ".collection.yaml";

    /// File extension for request files
    pub const REQUEST_EXT: &str = ".request.yaml";
}

/// Types of file system changes
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FileChangeType {
    /// File was created
    Created,
    /// File was modified
    Modified,
    /// File was deleted
    Deleted,
}

/// Manages collections and their associated requests on disk
pub struct CollectionManager {
    /// Base path for all collections
    pub base_path: PathBuf,

    /// YAML store for file I/O operations
    yaml_store: YAMLStore,

    /// In-memory index of collections for fast lookups
    /// Key: collection file path, Value: Collection
    collection_index: Arc<RwLock<HashMap<PathBuf, Collection>>>,

    /// Index of requests by name for O(1) lookup
    /// Key: request name, Value: (collection path, request index)
    request_index: Arc<RwLock<HashMap<String, (PathBuf, usize)>>>,

    /// File system watcher
    watcher: Arc<RwLock<Option<RecommendedWatcher>>>,
}

impl CollectionManager {
    /// Create a new collection manager with the specified base directory
    ///
    /// # Arguments
    /// * `base_path` - Base directory for storing collections
    ///
    /// # Returns
    /// A new CollectionManager instance
    pub fn new<P: AsRef<Path>>(base_path: P) -> YAMLStoreResult<Self> {
        let base_path = base_path.as_ref().to_path_buf();
        let yaml_store = YAMLStore::new(&base_path)?;

        Ok(Self {
            base_path,
            yaml_store,
            collection_index: Arc::new(RwLock::new(HashMap::new())),
            request_index: Arc::new(RwLock::new(HashMap::new())),
            watcher: Arc::new(RwLock::new(None)),
        })
    }

    /// Scan the base directory for all collection files
    ///
    /// # Returns
    /// Vector of paths to all collection files found
    pub fn scan_collections(&self) -> YAMLStoreResult<Vec<PathBuf>> {
        Self::scan_directory_recursive(&self.base_path, constants::COLLECTION_EXT)
    }

    /// Scan the base directory for all request files
    ///
    /// # Returns
    /// Vector of paths to all request files found
    pub fn scan_requests(&self) -> YAMLStoreResult<Vec<PathBuf>> {
        Self::scan_directory_recursive(&self.base_path, constants::REQUEST_EXT)
    }

    /// Load a collection from disk and add it to the index
    ///
    /// # Arguments
    /// * `path` - Path to the collection file
    ///
    /// # Returns
    /// The loaded collection
    pub fn load_collection<P: AsRef<Path>>(&self, path: P) -> YAMLStoreResult<Collection> {
        let path = path.as_ref();
        let collection = self.yaml_store.load_collection(path)?;

        // Add to index
        self.add_to_index(path, &collection);

        Ok(collection)
    }

    /// Save a collection to disk and update the index
    ///
    /// # Arguments
    /// * `collection` - The collection to save
    /// * `filename` - The name of the file (without extension)
    ///
    /// # Returns
    /// The full path to the saved file
    pub fn save_collection(
        &self,
        collection: &Collection,
        filename: &str,
    ) -> YAMLStoreResult<PathBuf> {
        let path = self.yaml_store.save_collection(collection, filename)?;

        // Update index
        self.add_to_index(&path, collection);

        Ok(path)
    }

    /// Load all collections from the base directory and build the index
    ///
    /// # Returns
    /// Number of collections loaded
    pub fn load_all_collections(&self) -> YAMLStoreResult<usize> {
        let collection_files = self.scan_collections()?;
        let mut count = 0;

        for path in collection_files {
            match self.load_collection(&path) {
                Ok(_) => count += 1,
                Err(e) => {
                    // Log error but continue loading other collections
                    eprintln!("Warning: Failed to load collection at {:?}: {}", path, e);
                }
            }
        }

        Ok(count)
    }

    /// Find a collection by name
    ///
    /// # Arguments
    /// * `name` - The name of the collection to find
    ///
    /// # Returns
    /// The collection if found, None otherwise
    pub fn find_collection_by_name(&self, name: &str) -> Option<Collection> {
        let index = self.collection_index.read().ok()?;
        index.values().find(|c| c.name == name).cloned()
    }

    /// Find a request by name across all loaded collections
    ///
    /// # Arguments
    /// * `name` - The name of the request to find
    ///
    /// # Returns
    /// The request if found, None otherwise
    pub fn find_request_by_name(&self, name: &str) -> Option<Request> {
        let request_index = self.request_index.read().ok()?;
        let (collection_path, request_idx) = request_index.get(name)?;

        let collection_index = self.collection_index.read().ok()?;
        let collection = collection_index.get(collection_path)?;

        collection.requests.get(*request_idx).cloned()
    }

    /// Get all loaded collections
    ///
    /// # Returns
    /// Vector of all collections in the index
    pub fn get_all_collections(&self) -> Vec<Collection> {
        self.collection_index
            .read()
            .map(|index| index.values().cloned().collect())
            .unwrap_or_default()
    }

    /// Clear the in-memory index
    pub fn clear_index(&self) {
        if let Ok(mut collection_index) = self.collection_index.write() {
            collection_index.clear();
        }
        if let Ok(mut request_index) = self.request_index.write() {
            request_index.clear();
        }
    }

    /// Get the number of collections in the index
    pub fn collection_count(&self) -> usize {
        self.collection_index
            .read()
            .map(|index| index.len())
            .unwrap_or(0)
    }

    /// Delete a collection file and remove from index
    ///
    /// # Arguments
    /// * `path` - Path to the collection file to delete
    pub fn delete_collection<P: AsRef<Path>>(&self, path: P) -> YAMLStoreResult<()> {
        let path = path.as_ref();

        // Remove from index first
        if let Ok(mut collection_index) = self.collection_index.write() {
            collection_index.remove(path);
        }

        // Delete the file
        self.yaml_store.delete_file(path)?;

        Ok(())
    }

    /// Start watching the collections directory for file changes
    ///
    /// This method sets up a file system watcher that will automatically
    /// reload collections when they are modified on disk.
    ///
    /// # Arguments
    /// * `callback` - Function to call when a collection file changes
    ///
    /// # Returns
    /// Result indicating success or failure
    pub fn start_watching<F>(&self, mut callback: F) -> YAMLStoreResult<()>
    where
        F: FnMut(PathBuf, FileChangeType) + Send + 'static,
    {
        let base_path = self.base_path.clone();

        let mut watcher = RecommendedWatcher::new(
            move |res: Result<Event, notify::Error>| {
                if let Ok(event) = res {
                    Self::handle_file_event(&event, &base_path, &mut callback);
                }
            },
            Config::default().with_poll_interval(Duration::from_millis(500)),
        )
        .map_err(|e| std::io::Error::other(e.to_string()))?;

        watcher
            .watch(&self.base_path, RecursiveMode::Recursive)
            .map_err(|e| std::io::Error::other(e.to_string()))?;

        // Store the watcher to keep it alive
        if let Ok(mut w) = self.watcher.write() {
            *w = Some(watcher);
        }

        Ok(())
    }

    /// Stop watching for file changes
    pub fn stop_watching(&self) {
        if let Ok(mut watcher) = self.watcher.write() {
            *watcher = None;
        }
    }

    /// Check if file watching is active
    pub fn is_watching(&self) -> bool {
        self.watcher.read().map(|w| w.is_some()).unwrap_or(false)
    }

    /// Validate a collection and fix common issues
    ///
    /// This utility checks for common problems and can optionally fix them:
    /// - Missing metadata fields (fills with defaults)
    /// - Duplicate request names (appends number suffix)
    /// - Invalid requests (removes them)
    ///
    /// # Arguments
    /// * `collection` - The collection to validate
    /// * `fix_issues` - Whether to fix issues automatically
    ///
    /// # Returns
    /// Tuple of (fixed_collection, issues_found)
    pub fn validate_and_fix_collection(
        collection: &Collection,
        fix_issues: bool,
    ) -> (Collection, Vec<String>) {
        let mut issues = Vec::new();
        let mut fixed = collection.clone();

        // Check metadata
        Self::validate_metadata(&mut fixed, &mut issues, fix_issues);

        // Check for duplicate request names
        Self::validate_duplicate_names(&mut fixed, &mut issues, fix_issues);

        // Validate each request
        Self::validate_requests(&mut fixed, &mut issues, fix_issues);

        (fixed, issues)
    }

    /// Validate and fix metadata fields
    fn validate_metadata(collection: &mut Collection, issues: &mut Vec<String>, fix_issues: bool) {
        if collection.metadata.version.is_none() {
            issues.push("Missing version metadata".to_string());
            if fix_issues {
                collection.metadata.version = Some("1.0.0".to_string());
            }
        }
    }

    /// Validate and fix duplicate request names
    fn validate_duplicate_names(
        collection: &mut Collection,
        issues: &mut Vec<String>,
        fix_issues: bool,
    ) {
        let mut seen_names = std::collections::HashMap::new();
        let mut fixed_requests = Vec::new();

        for (idx, request) in collection.requests.iter().enumerate() {
            if let Some(&first_idx) = seen_names.get(&request.name) {
                issues.push(format!(
                    "Duplicate request name '{}' at indices {} and {}",
                    request.name, first_idx, idx
                ));

                if fix_issues {
                    let mut renamed = request.clone();
                    renamed.name = format!("{} ({})", request.name, idx);
                    fixed_requests.push(renamed);
                } else {
                    fixed_requests.push(request.clone());
                }
            } else {
                seen_names.insert(request.name.clone(), idx);
                fixed_requests.push(request.clone());
            }
        }

        if fix_issues && !issues.is_empty() {
            collection.requests = fixed_requests;
        }
    }

    /// Validate individual requests and remove invalid ones
    fn validate_requests(collection: &mut Collection, issues: &mut Vec<String>, fix_issues: bool) {
        let valid_requests: Vec<Request> = collection
            .requests
            .iter()
            .filter(|r| {
                if let Err(e) = r.validate() {
                    issues.push(format!("Invalid request '{}': {}", r.name, e));
                    !fix_issues
                } else {
                    true
                }
            })
            .cloned()
            .collect();

        if fix_issues {
            collection.requests = valid_requests;
        }
    }

    /// Migrate a collection to ensure it has all required metadata
    ///
    /// # Arguments
    /// * `path` - Path to the collection file
    ///
    /// # Returns
    /// The migrated collection
    pub fn migrate_collection<P: AsRef<Path>>(&self, path: P) -> YAMLStoreResult<Collection> {
        let path = path.as_ref();
        let mut collection = self.yaml_store.load_collection(path)?;

        // Ensure metadata exists
        if collection.metadata.version.is_none() {
            collection.metadata.version = Some("1.0.0".to_string());
        }

        // Add timestamps if missing
        if collection.metadata.created_at.is_none() {
            let now = chrono::Utc::now().to_rfc3339();
            collection.metadata.created_at = Some(now.clone());
            collection.metadata.updated_at = Some(now);
        }

        // Save the migrated collection
        self.yaml_store.save_collection(
            &collection,
            path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("migrated"),
        )?;

        Ok(collection)
    }

    /// Check collection integrity and report issues
    ///
    /// # Arguments
    /// * `path` - Path to the collection file
    ///
    /// # Returns
    /// Vector of issues found (empty if no issues)
    pub fn check_integrity<P: AsRef<Path>>(&self, path: P) -> Vec<String> {
        match self.yaml_store.load_collection(path.as_ref()) {
            Ok(collection) => {
                let (_, issues) = Self::validate_and_fix_collection(&collection, false);
                issues
            }
            Err(e) => vec![format!("Failed to load collection: {}", e)],
        }
    }

    // Private helper methods

    /// Handle a file system event
    fn handle_file_event<F>(event: &Event, base_path: &Path, callback: &mut F)
    where
        F: FnMut(PathBuf, FileChangeType),
    {
        let change_type = match &event.kind {
            EventKind::Create(_) => FileChangeType::Created,
            EventKind::Modify(_) => FileChangeType::Modified,
            EventKind::Remove(_) => FileChangeType::Deleted,
            _ => return, // Ignore other event types
        };

        for path in &event.paths {
            // Only process collection files
            if let Some(file_name) = path.file_name() {
                if file_name
                    .to_string_lossy()
                    .ends_with(constants::COLLECTION_EXT)
                {
                    // Make path relative to base_path if possible
                    let relative_path = path.strip_prefix(base_path).unwrap_or(path);
                    callback(relative_path.to_path_buf(), change_type);
                }
            }
        }
    }

    /// Recursively scan a directory for files with a specific extension
    fn scan_directory_recursive(dir: &Path, extension: &str) -> YAMLStoreResult<Vec<PathBuf>> {
        let mut files = Vec::new();

        if !dir.exists() {
            return Ok(files);
        }

        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                // Recursively scan subdirectories
                let mut sub_files = Self::scan_directory_recursive(&path, extension)?;
                files.append(&mut sub_files);
            } else if path.is_file() {
                if let Some(file_name) = path.file_name() {
                    if file_name.to_string_lossy().ends_with(extension) {
                        files.push(path);
                    }
                }
            }
        }

        Ok(files)
    }

    /// Add a collection to the in-memory index
    pub fn add_to_index(&self, path: &Path, collection: &Collection) {
        // Add collection to collection index
        if let Ok(mut collection_index) = self.collection_index.write() {
            collection_index.insert(path.to_path_buf(), collection.clone());
        }

        // Add requests to request index
        if let Ok(mut request_index) = self.request_index.write() {
            for (idx, request) in collection.requests.iter().enumerate() {
                request_index.insert(request.name.clone(), (path.to_path_buf(), idx));
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::HttpMethod;
    use tempfile::TempDir;

    fn create_test_request(name: &str, url: &str) -> Request {
        Request::new(name, url).with_method(HttpMethod::Get)
    }

    fn create_test_collection(name: &str) -> Collection {
        Collection::new(name)
            .with_description("A test collection")
            .add_request(create_test_request(
                "Get Users",
                "https://api.example.com/users",
            ))
            .add_request(create_test_request(
                "Get Posts",
                "https://api.example.com/posts",
            ))
    }

    #[test]
    fn test_new_creates_directory() {
        let temp_dir = TempDir::new().unwrap();
        let manager_path = temp_dir.path().join("collections");

        assert!(!manager_path.exists());
        let _manager = CollectionManager::new(&manager_path).unwrap();
        assert!(manager_path.exists());
    }

    #[test]
    fn test_save_and_load_collection() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        let collection = create_test_collection("Test API");
        let saved_path = manager.save_collection(&collection, "test-api").unwrap();

        assert!(saved_path.exists());

        let loaded = manager.load_collection(&saved_path).unwrap();
        assert_eq!(loaded.name, "Test API");
        assert_eq!(loaded.requests.len(), 2);
    }

    #[test]
    fn test_scan_collections() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        // Initially empty
        let collections = manager.scan_collections().unwrap();
        assert_eq!(collections.len(), 0);

        // Add some collections
        manager
            .save_collection(&create_test_collection("API 1"), "api1")
            .unwrap();
        manager
            .save_collection(&create_test_collection("API 2"), "api2")
            .unwrap();

        let collections = manager.scan_collections().unwrap();
        assert_eq!(collections.len(), 2);
    }

    #[test]
    fn test_load_all_collections() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        manager
            .save_collection(&create_test_collection("API 1"), "api1")
            .unwrap();
        manager
            .save_collection(&create_test_collection("API 2"), "api2")
            .unwrap();

        let count = manager.load_all_collections().unwrap();
        assert_eq!(count, 2);
        assert_eq!(manager.collection_count(), 2);
    }

    #[test]
    fn test_find_collection_by_name() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        manager
            .save_collection(&create_test_collection("User API"), "user-api")
            .unwrap();

        let collection = manager.find_collection_by_name("User API");
        assert!(collection.is_some());
        assert_eq!(collection.unwrap().name, "User API");

        let missing = manager.find_collection_by_name("Nonexistent");
        assert!(missing.is_none());
    }

    #[test]
    fn test_find_request_by_name() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        let collection = create_test_collection("Test API");
        manager.save_collection(&collection, "test-api").unwrap();

        let request = manager.find_request_by_name("Get Users");
        assert!(request.is_some());
        assert_eq!(request.unwrap().url, "https://api.example.com/users");

        let missing = manager.find_request_by_name("Nonexistent");
        assert!(missing.is_none());
    }

    #[test]
    fn test_get_all_collections() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        manager
            .save_collection(&create_test_collection("API 1"), "api1")
            .unwrap();
        manager
            .save_collection(&create_test_collection("API 2"), "api2")
            .unwrap();

        let all = manager.get_all_collections();
        assert_eq!(all.len(), 2);
    }

    #[test]
    fn test_clear_index() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        manager
            .save_collection(&create_test_collection("API 1"), "api1")
            .unwrap();
        assert_eq!(manager.collection_count(), 1);

        manager.clear_index();
        assert_eq!(manager.collection_count(), 0);
    }

    #[test]
    fn test_delete_collection() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        let path = manager
            .save_collection(&create_test_collection("API 1"), "api1")
            .unwrap();
        assert!(path.exists());
        assert_eq!(manager.collection_count(), 1);

        manager.delete_collection(&path).unwrap();
        assert!(!path.exists());
        assert_eq!(manager.collection_count(), 0);
    }

    #[test]
    fn test_recursive_scan() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        // Create nested directory structure
        let sub_dir = temp_dir.path().join("apis");
        std::fs::create_dir(&sub_dir).unwrap();

        // Save collections at different levels
        manager
            .save_collection(&create_test_collection("Root API"), "root-api")
            .unwrap();

        // Save in subdirectory
        let yaml_store = YAMLStore::new(&sub_dir).unwrap();
        yaml_store
            .save_collection(&create_test_collection("Nested API"), "nested-api")
            .unwrap();

        let collections = manager.scan_collections().unwrap();
        assert_eq!(collections.len(), 2);
    }

    #[test]
    fn test_load_all_with_errors() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        // Save a valid collection
        manager
            .save_collection(&create_test_collection("Valid API"), "valid")
            .unwrap();

        // Create a malformed YAML file
        let bad_path = temp_dir.path().join("bad.collection.yaml");
        std::fs::write(&bad_path, "invalid: yaml: [[[").unwrap();

        // Should load the valid one and skip the invalid one
        let count = manager.load_all_collections().unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_request_index_uniqueness() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        // Create two collections with a request of the same name
        let collection1 = Collection::new("API 1")
            .add_request(create_test_request("Common Request", "https://api1.com"));
        let collection2 = Collection::new("API 2")
            .add_request(create_test_request("Common Request", "https://api2.com"));

        manager.save_collection(&collection1, "api1").unwrap();
        manager.save_collection(&collection2, "api2").unwrap();

        // The last one loaded should be in the index (LIFO)
        let request = manager.find_request_by_name("Common Request");
        assert!(request.is_some());
    }

    #[test]
    fn test_concurrent_index_access() {
        use std::sync::Arc;
        use std::thread;

        let temp_dir = TempDir::new().unwrap();
        let manager = Arc::new(CollectionManager::new(temp_dir.path()).unwrap());

        let mut handles = vec![];

        for i in 0..5 {
            let manager_clone = Arc::clone(&manager);
            let handle = thread::spawn(move || {
                let collection = create_test_collection(&format!("API {}", i));
                manager_clone.save_collection(&collection, &format!("api{}", i))
            });
            handles.push(handle);
        }

        for handle in handles {
            handle.join().unwrap().unwrap();
        }

        assert_eq!(manager.collection_count(), 5);
    }

    #[test]
    fn test_file_watcher_initialization() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        assert!(!manager.is_watching());

        let result = manager.start_watching(|_path, _change_type| {
            // No-op callback for testing
        });

        assert!(result.is_ok());
        assert!(manager.is_watching());

        manager.stop_watching();
        assert!(!manager.is_watching());
    }

    #[test]
    fn test_file_watcher_detects_changes() {
        use std::sync::{Arc, Mutex};
        use std::thread;

        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        let events = Arc::new(Mutex::new(Vec::new()));
        let events_clone = Arc::clone(&events);

        manager
            .start_watching(move |path, change_type| {
                if let Ok(mut e) = events_clone.lock() {
                    e.push((path, change_type));
                }
            })
            .unwrap();

        // Give watcher time to start
        thread::sleep(std::time::Duration::from_millis(100));

        // Create a collection file
        manager
            .save_collection(&create_test_collection("Test"), "test")
            .unwrap();

        // Give watcher time to detect the change
        thread::sleep(std::time::Duration::from_millis(600));

        let captured_events = events.lock().unwrap();
        assert!(
            !captured_events.is_empty(),
            "Watcher should detect file changes"
        );

        manager.stop_watching();
    }

    #[test]
    fn test_validate_and_fix_collection() {
        let collection = Collection::new("Test")
            .add_request(create_test_request(
                "Request 1",
                "https://api.example.com/1",
            ))
            .add_request(create_test_request(
                "Request 1",
                "https://api.example.com/2",
            )); // Duplicate name

        let (fixed, issues) = CollectionManager::validate_and_fix_collection(&collection, true);

        assert!(!issues.is_empty(), "Should detect duplicate names");
        assert_eq!(fixed.requests[0].name, "Request 1");
        assert_eq!(fixed.requests[1].name, "Request 1 (1)"); // Fixed with suffix
    }

    #[test]
    fn test_validate_without_fixing() {
        let collection = Collection::new("Test")
            .add_request(create_test_request(
                "Request 1",
                "https://api.example.com/1",
            ))
            .add_request(create_test_request(
                "Request 1",
                "https://api.example.com/2",
            ));

        let (fixed, issues) = CollectionManager::validate_and_fix_collection(&collection, false);

        assert!(!issues.is_empty());
        assert_eq!(fixed.requests[1].name, "Request 1"); // Not fixed
    }

    #[test]
    fn test_validate_removes_invalid_requests() {
        let mut collection = Collection::new("Test").add_request(create_test_request(
            "Valid",
            "https://api.example.com/valid",
        ));

        // Add an invalid request manually
        let invalid = Request::new("Invalid", ""); // Empty URL is invalid
        collection.requests.push(invalid);

        let (fixed, issues) = CollectionManager::validate_and_fix_collection(&collection, true);

        assert!(!issues.is_empty(), "Should detect invalid request");
        assert_eq!(fixed.requests.len(), 1); // Invalid request removed
        assert_eq!(fixed.requests[0].name, "Valid");
    }

    #[test]
    fn test_migrate_collection() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        // Create collection without full metadata
        let mut collection = create_test_collection("Legacy API");
        collection.metadata.created_at = None;
        collection.metadata.updated_at = None;

        let path = manager.save_collection(&collection, "legacy").unwrap();

        // Migrate it
        let migrated = manager.migrate_collection(&path).unwrap();

        assert!(migrated.metadata.created_at.is_some());
        assert!(migrated.metadata.updated_at.is_some());
    }

    #[test]
    fn test_check_integrity() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        let collection = create_test_collection("Test API");
        let path = manager.save_collection(&collection, "test").unwrap();

        let issues = manager.check_integrity(&path);
        assert!(issues.is_empty(), "Valid collection should have no issues");
    }

    #[test]
    fn test_check_integrity_with_issues() {
        let temp_dir = TempDir::new().unwrap();
        let manager = CollectionManager::new(temp_dir.path()).unwrap();

        let collection = Collection::new("Test")
            .add_request(create_test_request("Req", "https://api.example.com"))
            .add_request(create_test_request("Req", "https://api.example.com")); // Duplicate

        let path = manager.save_collection(&collection, "test").unwrap();

        let issues = manager.check_integrity(&path);
        assert!(!issues.is_empty(), "Should detect duplicate names");
    }
}
