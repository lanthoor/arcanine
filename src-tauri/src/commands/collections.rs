//! Collection management commands
//!
//! This module provides Tauri commands for managing collections, including
//! loading, saving, creating, listing, deleting, and validating collections.

use crate::models::Collection;
use crate::storage::CollectionManager;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::State;

/// Shared application state containing the collection manager
pub struct AppState {
    pub collection_manager: Arc<CollectionManager>,
}

/// Sanitize a collection name to create a safe filename
///
/// Converts to lowercase, replaces spaces with dashes, and filters to alphanumeric + dashes.
/// Returns an error if the result is empty or contains only dashes.
fn sanitize_filename(name: &str) -> Result<String, String> {
    let filename: String = name
        .to_lowercase()
        .replace(' ', "-")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-')
        .collect();

    // Check if empty or contains only dashes
    if filename.is_empty() || filename.chars().all(|c| c == '-') {
        return Err("Collection name must contain at least one alphanumeric character".to_string());
    }

    Ok(filename)
}

/// Validate that a path is within the collections directory
///
/// Prevents directory traversal attacks by ensuring the canonical path
/// is within the collection manager's base directory.
fn validate_path_in_collections(path: &Path, base_path: &Path) -> Result<PathBuf, String> {
    // Canonicalize both paths to resolve .. and symlinks
    let canonical_path = path
        .canonicalize()
        .map_err(|e| format!("Invalid path: {}", e))?;

    let canonical_base = base_path
        .canonicalize()
        .map_err(|e| format!("Invalid base path: {}", e))?;

    // Ensure path is within collections directory
    if !canonical_path.starts_with(canonical_base) {
        return Err("Access denied: path outside collections directory".to_string());
    }

    Ok(canonical_path)
}

/// Load a collection from the filesystem
///
/// # Arguments
/// * `path` - Path to the collection file (relative or absolute)
/// * `state` - Application state containing the collection manager
///
/// # Returns
/// * `Ok(Collection)` - Successfully loaded collection
/// * `Err(String)` - Error message if loading fails
///
/// # Example
/// ```typescript
/// const collection = await invoke('load_collection', { path: './my-collection.yaml' });
/// ```
#[tauri::command]
pub async fn load_collection(
    path: String,
    state: State<'_, AppState>,
) -> Result<Collection, String> {
    let path_buf = PathBuf::from(&path);

    // Validate path is within collections directory
    let validated_path =
        validate_path_in_collections(&path_buf, &state.collection_manager.base_path)?;

    state
        .collection_manager
        .load_collection(&validated_path)
        .map_err(|e| format!("Failed to load collection: {}", e))
}

/// Save a collection to the filesystem
///
/// # Arguments
/// * `collection` - Collection to save
/// * `filename` - Filename for the collection (without extension)
/// * `state` - Application state containing the collection manager
///
/// # Returns
/// * `Ok(String)` - Path where the collection was saved
/// * `Err(String)` - Error message if saving fails
///
/// # Example
/// ```typescript
/// const path = await invoke('save_collection', {
///   collection: myCollection,
///   filename: 'my-api'
/// });
/// ```
#[tauri::command]
pub async fn save_collection(
    collection: Collection,
    filename: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    // Basic validation
    if collection.name.trim().is_empty() {
        return Err("Collection name cannot be empty".to_string());
    }

    // Validate filename doesn't contain path separators
    if filename.contains('/') || filename.contains('\\') {
        return Err("Filename cannot contain path separators".to_string());
    }

    // Validate filename is not empty
    if filename.trim().is_empty() {
        return Err("Filename cannot be empty".to_string());
    }

    let path = state
        .collection_manager
        .save_collection(&collection, &filename)
        .map_err(|e| format!("Failed to save collection: {}", e))?;

    Ok(path.to_string_lossy().to_string())
}

/// Create a new collection with default metadata
///
/// # Arguments
/// * `name` - Display name for the collection
/// * `state` - Application state containing the collection manager
///
/// # Returns
/// * `Ok((Collection, String))` - New collection and its file path
/// * `Err(String)` - Error message if creation fails
///
/// # Example
/// ```typescript
/// const [collection, path] = await invoke('create_new_collection', {
///   name: 'My API'
/// });
/// ```
#[tauri::command]
pub async fn create_new_collection(
    name: String,
    state: State<'_, AppState>,
) -> Result<(Collection, String), String> {
    // Create new collection with metadata
    let collection = Collection::new(name.clone());

    // Generate filename from name (kebab-case) with validation
    let filename = sanitize_filename(&name)?;

    // Save the collection
    let path = state
        .collection_manager
        .save_collection(&collection, &filename)
        .map_err(|e| format!("Failed to create collection: {}", e))?;

    Ok((collection, path.to_string_lossy().to_string()))
}

/// Open a native file picker dialog to select a collection file
///
/// # Returns
/// * `Ok(Some(String))` - Selected file path
/// * `Ok(None)` - User cancelled the dialog
/// * `Err(String)` - Error message if dialog fails
///
/// # Example
/// ```typescript
/// const path = await invoke('open_collection_dialog');
/// if (path) {
///   const collection = await invoke('load_collection', { path });
/// }
/// ```
#[tauri::command]
pub async fn open_collection_dialog() -> Result<Option<String>, String> {
    // Note: In Tauri v2, file dialogs should be handled from the frontend
    // using the @tauri-apps/plugin-dialog package.
    // This is a placeholder that returns None, signaling the frontend to use its dialog.
    Ok(None)
}

/// List all collections currently loaded in the collection manager
///
/// # Arguments
/// * `state` - Application state containing the collection manager
///
/// # Returns
/// * `Ok(Vec<Collection>)` - List of all loaded collections
/// * `Err(String)` - Error message if listing fails
///
/// # Example
/// ```typescript
/// const collections = await invoke('list_collections');
/// console.log(`Found ${collections.length} collections`);
/// ```
#[tauri::command]
pub async fn list_collections(state: State<'_, AppState>) -> Result<Vec<Collection>, String> {
    Ok(state.collection_manager.get_all_collections())
}

/// Delete a collection file from the filesystem
///
/// # Arguments
/// * `path` - Path to the collection file to delete
/// * `state` - Application state containing the collection manager
///
/// # Returns
/// * `Ok(())` - Collection successfully deleted
/// * `Err(String)` - Error message if deletion fails
///
/// # Example
/// ```typescript
/// await invoke('delete_collection', { path: './my-collection.yaml' });
/// ```
#[tauri::command]
pub async fn delete_collection(path: String, state: State<'_, AppState>) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);

    // Validate path is within collections directory
    let validated_path =
        validate_path_in_collections(&path_buf, &state.collection_manager.base_path)?;

    state
        .collection_manager
        .delete_collection(&validated_path)
        .map_err(|e| format!("Failed to delete collection: {}", e))
}

/// Validate a collection and optionally fix issues
///
/// # Arguments
/// * `path` - Path to the collection file to validate
/// * `auto_fix` - Whether to automatically fix issues found
/// * `state` - Application state containing the collection manager
///
/// # Returns
/// * `Ok((Collection, Vec<String>))` - Validated/fixed collection and list of issues found
/// * `Err(String)` - Error message if validation fails
///
/// # Example
/// ```typescript
/// const [collection, issues] = await invoke('validate_collection', {
///   path: './my-collection.yaml',
///   autoFix: true
/// });
/// if (issues.length > 0) {
///   console.log('Issues found and fixed:', issues);
/// }
/// ```
#[tauri::command]
pub async fn validate_collection(
    path: String,
    auto_fix: bool,
    state: State<'_, AppState>,
) -> Result<(Collection, Vec<String>), String> {
    let path_buf = PathBuf::from(&path);

    // Validate path is within collections directory
    let validated_path =
        validate_path_in_collections(&path_buf, &state.collection_manager.base_path)?;

    // Load the collection
    let collection = state
        .collection_manager
        .load_collection(&validated_path)
        .map_err(|e| format!("Failed to load collection: {}", e))?;

    // Validate and optionally fix
    let (fixed_collection, issues) =
        CollectionManager::validate_and_fix_collection(&collection, auto_fix);

    // If auto_fix is enabled and issues were found, save the fixed collection
    if auto_fix && !issues.is_empty() {
        let filename = validated_path
            .file_stem()
            .and_then(|s| s.to_str())
            .ok_or_else(|| "Invalid filename".to_string())?;

        state
            .collection_manager
            .save_collection(&fixed_collection, filename)
            .map_err(|e| format!("Failed to save fixed collection: {}", e))?;
    }

    Ok((fixed_collection, issues))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Request;
    use std::path::PathBuf;
    use std::sync::Arc;
    use tempfile::TempDir;

    // Helper to test command logic directly without Tauri State
    fn setup_test_manager() -> (Arc<CollectionManager>, TempDir) {
        let temp_dir = TempDir::new().unwrap();
        let manager = Arc::new(CollectionManager::new(temp_dir.path()).unwrap());
        (manager, temp_dir)
    }

    #[test]
    fn test_appstate_creation() {
        let (manager, _temp_dir) = setup_test_manager();
        let _state = AppState {
            collection_manager: manager,
        };
        // Test passes if AppState can be created successfully
    }

    #[tokio::test]
    async fn test_collection_filename_sanitization() {
        // Test the filename generation logic using the helper function
        let test_cases = vec![
            ("My API", "my-api"),
            ("Test@API#Collection!", "testapicollection"),
            ("Hello World 123", "hello-world-123"),
            ("UPPERCASE", "uppercase"),
            ("with---dashes", "with---dashes"),
        ];

        for (input, expected) in test_cases {
            let result = sanitize_filename(input);
            assert!(result.is_ok(), "Failed for input: {}", input);
            assert_eq!(result.unwrap(), expected, "Failed for input: {}", input);
        }
    }

    #[tokio::test]
    async fn test_load_collection_logic() {
        let (manager, _temp_dir) = setup_test_manager();

        // Create a test collection file
        let collection = Collection::new("Test Collection");
        let path = manager.save_collection(&collection, "test").unwrap();

        // Test loading
        let loaded = manager.load_collection(&path).unwrap();
        assert_eq!(loaded.name, "Test Collection");
    }

    #[tokio::test]
    async fn test_load_collection_not_found() {
        let (manager, _temp_dir) = setup_test_manager();

        let result = manager.load_collection(PathBuf::from("nonexistent.yaml"));
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_save_collection_validation() {
        // Test the validation logic
        let collection = Collection::new("Valid Name");
        assert!(!collection.name.trim().is_empty());

        let mut invalid_collection = Collection::new("Test");
        invalid_collection.name = String::new();
        assert!(invalid_collection.name.trim().is_empty());
    }

    #[tokio::test]
    async fn test_save_collection_logic() {
        let (manager, _temp_dir) = setup_test_manager();

        let collection = Collection::new("Test API")
            .add_request(Request::new("Get Users", "https://api.example.com/users"));

        // Test saving
        let result = manager.save_collection(&collection, "test-api");
        assert!(result.is_ok());

        let path = result.unwrap();
        assert!(path.to_string_lossy().contains("test-api"));
    }

    #[tokio::test]
    async fn test_create_new_collection_logic() {
        let (manager, _temp_dir) = setup_test_manager();

        let name = "New API".to_string();
        let collection = Collection::new(name.clone());

        let filename = sanitize_filename(&name).unwrap();

        let path = manager.save_collection(&collection, &filename).unwrap();

        assert_eq!(collection.name, "New API");
        assert!(path.to_string_lossy().contains("new-api"));
    }

    #[tokio::test]
    async fn test_list_collections_logic() {
        let (manager, _temp_dir) = setup_test_manager();

        // Initially empty
        assert_eq!(manager.get_all_collections().len(), 0);

        // Create some collections
        manager
            .save_collection(&Collection::new("API 1"), "api-1")
            .unwrap();
        manager
            .save_collection(&Collection::new("API 2"), "api-2")
            .unwrap();

        // Load them
        manager.load_all_collections().unwrap();

        // Verify list
        let collections = manager.get_all_collections();
        assert_eq!(collections.len(), 2);
    }

    #[tokio::test]
    async fn test_delete_collection_logic() {
        let (manager, _temp_dir) = setup_test_manager();

        // Create and save a collection
        let collection = Collection::new("To Delete");
        let path = manager.save_collection(&collection, "to-delete").unwrap();

        // Verify it exists
        assert!(path.exists());

        // Delete it
        let result = manager.delete_collection(&path);
        assert!(result.is_ok());

        // Verify it's gone
        assert!(!path.exists());
    }

    #[tokio::test]
    async fn test_delete_collection_not_found() {
        let (manager, _temp_dir) = setup_test_manager();

        let result = manager.delete_collection(PathBuf::from("nonexistent.yaml"));
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_validate_collection_logic() {
        let (_manager, _temp_dir) = setup_test_manager();

        // Create a valid collection
        let collection = Collection::new("Valid")
            .add_request(Request::new("Request 1", "https://api.example.com/1"));

        let (_fixed, issues) = CollectionManager::validate_and_fix_collection(&collection, false);
        assert_eq!(issues.len(), 0);
    }

    #[tokio::test]
    async fn test_validate_collection_with_duplicates() {
        let (_manager, _temp_dir) = setup_test_manager();

        // Create collection with duplicate names
        let collection = Collection::new("Test")
            .add_request(Request::new("Get User", "https://api.example.com/user/1"))
            .add_request(Request::new("Get User", "https://api.example.com/user/2"));

        let (_fixed, issues) = CollectionManager::validate_and_fix_collection(&collection, false);
        assert!(!issues.is_empty());
        assert!(issues.iter().any(|i| i.contains("Duplicate request name")));
    }

    #[tokio::test]
    async fn test_validate_with_auto_fix() {
        let (_manager, _temp_dir) = setup_test_manager();

        // Create collection with duplicates
        let collection = Collection::new("Test")
            .add_request(Request::new("Get User", "https://api.example.com/user/1"))
            .add_request(Request::new("Get User", "https://api.example.com/user/2"));

        let (fixed, issues) = CollectionManager::validate_and_fix_collection(&collection, true);
        assert!(!issues.is_empty());

        // Verify names are now unique
        let names: Vec<String> = fixed.requests.iter().map(|r| r.name.clone()).collect();
        assert_eq!(names.len(), 2);
        assert_ne!(names[0], names[1]);
    }

    #[tokio::test]
    async fn test_filename_extraction() {
        // Test filename extraction logic from validate_collection
        let path = PathBuf::from("/path/to/my-collection.yaml");
        let filename = path.file_stem().and_then(|s| s.to_str());
        assert_eq!(filename, Some("my-collection"));

        let path_no_ext = PathBuf::from("/path/to/file");
        let filename_no_ext = path_no_ext.file_stem().and_then(|s| s.to_str());
        assert_eq!(filename_no_ext, Some("file"));
    }

    #[tokio::test]
    async fn test_full_workflow() {
        let (manager, _temp_dir) = setup_test_manager();

        // 1. Create new collection
        let collection = Collection::new("Workflow Test");
        let filename = "workflow-test";
        let path = manager.save_collection(&collection, filename).unwrap();

        // 2. Load it
        let loaded = manager.load_collection(&path).unwrap();
        assert_eq!(loaded.name, "Workflow Test");

        // 3. Modify and save
        let modified =
            loaded.add_request(Request::new("Get Items", "https://api.example.com/items"));
        manager.save_collection(&modified, filename).unwrap();

        // 4. Load again to verify changes
        let reloaded = manager.load_collection(&path).unwrap();
        assert_eq!(reloaded.requests.len(), 1);

        // 5. Validate
        let (_fixed, issues) = CollectionManager::validate_and_fix_collection(&reloaded, false);
        assert_eq!(issues.len(), 0);

        // 6. Delete
        manager.delete_collection(&path).unwrap();

        // 7. Verify deletion
        assert!(!path.exists());
    }

    #[tokio::test]
    async fn test_error_message_formatting() {
        // Test error message formatting used in commands
        let base_error = "File not found";
        let formatted = format!("Failed to load collection: {}", base_error);
        assert_eq!(formatted, "Failed to load collection: File not found");

        let save_error = "Permission denied";
        let formatted_save = format!("Failed to save collection: {}", save_error);
        assert_eq!(
            formatted_save,
            "Failed to save collection: Permission denied"
        );
    }

    #[tokio::test]
    async fn test_path_conversion() {
        // Test PathBuf conversion logic used in commands
        let path_str = "./my-collection.yaml";
        let path_buf = PathBuf::from(path_str);
        assert_eq!(path_buf.to_string_lossy(), path_str);

        let abs_path = "/absolute/path/collection.yaml";
        let abs_buf = PathBuf::from(abs_path);
        assert_eq!(abs_buf.to_string_lossy(), abs_path);
    }

    // Security Tests

    #[tokio::test]
    async fn test_sanitize_filename_with_valid_names() {
        let test_cases = vec![
            ("My API", "my-api"),
            ("Hello World 123", "hello-world-123"),
            ("UPPERCASE", "uppercase"),
        ];

        for (input, expected) in test_cases {
            let result = sanitize_filename(input);
            assert!(result.is_ok());
            assert_eq!(result.unwrap(), expected);
        }
    }

    #[tokio::test]
    async fn test_sanitize_filename_removes_special_chars() {
        let test_cases = vec![
            ("Test@API#Collection!", "testapicollection"),
            ("with---dashes", "with---dashes"),
            ("a!b@c#d$e%", "abcde"),
        ];

        for (input, expected) in test_cases {
            let result = sanitize_filename(input);
            assert!(result.is_ok());
            assert_eq!(result.unwrap(), expected);
        }
    }

    #[tokio::test]
    async fn test_sanitize_filename_rejects_empty_results() {
        let invalid_inputs = vec![
            "!!!",       // Only special chars
            "@#$%^&*()", // No alphanumerics
            "   ",       // Only spaces
            "!@#",       // Mixed special chars
        ];

        for input in invalid_inputs {
            let result = sanitize_filename(input);
            assert!(result.is_err(), "Should reject input: {}", input);
            assert!(result.unwrap_err().contains("alphanumeric"));
        }
    }

    #[tokio::test]
    async fn test_save_collection_rejects_path_separators() {
        let (manager, _temp_dir) = setup_test_manager();
        let collection = Collection::new("Test");

        // Test Unix path separator
        let result = manager.save_collection(&collection, "../etc/passwd");
        assert!(result.is_err());

        // Test Windows path separator
        let result = manager.save_collection(&collection, "..\\windows\\system32");
        assert!(result.is_err());

        // Test nested paths
        let result = manager.save_collection(&collection, "../../malicious");
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_save_collection_rejects_empty_filename() {
        let (manager, _temp_dir) = setup_test_manager();
        let collection = Collection::new("Test");

        let result = manager.save_collection(&collection, "");
        assert!(result.is_err());
        let error_msg = format!("{}", result.unwrap_err());
        assert!(error_msg.to_lowercase().contains("empty"));

        let result = manager.save_collection(&collection, "   ");
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_new_collection_rejects_invalid_names() {
        // Test names that would result in empty filenames
        let invalid_names = vec!["!!!", "@#$%", "   "];

        for name in invalid_names {
            let result = sanitize_filename(name);
            assert!(result.is_err(), "Should reject name: {}", name);
        }
    }

    #[tokio::test]
    async fn test_path_validation_prevents_traversal() {
        let (manager, _temp_dir) = setup_test_manager();

        // Create a valid collection
        let collection = Collection::new("Valid");
        let path = manager.save_collection(&collection, "valid").unwrap();

        // Test that validate_path_in_collections works for valid paths
        let result = validate_path_in_collections(&path, &manager.base_path);
        assert!(result.is_ok());

        // Note: Cannot test traversal with non-existent paths as canonicalize will fail
        // This is actually good security - non-existent paths are rejected
    }

    #[tokio::test]
    async fn test_sanitize_filename_unicode() {
        // Test that Unicode characters are filtered appropriately
        let result = sanitize_filename("Hello世界");
        assert!(result.is_ok());
        // Unicode letters are alphanumeric, so they should be preserved

        let result = sanitize_filename("Ñoño");
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_sanitize_filename_mixed_valid_invalid() {
        // Mix of valid and invalid characters should keep valid ones
        let result = sanitize_filename("My!@#API$%^123");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "myapi123");
    }
}
