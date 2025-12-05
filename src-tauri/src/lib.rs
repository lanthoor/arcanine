pub mod commands;
pub mod models;
pub mod services;
pub mod storage;

use commands::collections::{
    create_new_collection, delete_collection, delete_request_from_collection, list_collections,
    load_collection, load_requests_from_collection, open_collection_dialog, save_collection,
    save_request_to_collection, update_request_in_collection, validate_collection, AppState,
};
use commands::requests::{delete_request, execute_request, list_requests, save_request};
use services::http::HTTPService;
use std::sync::{Arc, Mutex};
use storage::{collection_manager::CollectionManager, request_store::RequestStore};
use tokio::sync::Mutex as TokioMutex;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize shared state
    let http_service = Arc::new(TokioMutex::new(
        HTTPService::new().expect("Failed to create HTTP service"),
    ));
    let request_store = Arc::new(Mutex::new(RequestStore::new()));

    // Initialize collection manager
    let collection_manager = Arc::new(
        CollectionManager::new("./collections").expect("Failed to create collection manager"),
    );
    let app_state = AppState { collection_manager };

    tauri::Builder::default()
        .manage(http_service)
        .manage(request_store)
        .manage(app_state)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            execute_request,
            save_request,
            list_requests,
            delete_request,
            load_collection,
            save_collection,
            create_new_collection,
            open_collection_dialog,
            list_collections,
            delete_collection,
            validate_collection,
            save_request_to_collection,
            load_requests_from_collection,
            delete_request_from_collection,
            update_request_in_collection
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_greet_returns_greeting() {
        let result = greet("World");
        assert!(result.contains("Hello, World!"));
        assert!(result.contains("greeted from Rust"));
    }

    #[test]
    fn test_greet_with_empty_name() {
        let result = greet("");
        assert!(result.contains("Hello, !"));
    }

    #[test]
    fn test_greet_with_special_characters() {
        let result = greet("Alice & Bob");
        assert!(result.contains("Alice & Bob"));
    }

    #[test]
    fn test_greet_format() {
        let result = greet("Test");
        assert_eq!(result, "Hello, Test! You've been greeted from Rust!");
    }

    #[test]
    fn test_greet_with_unicode() {
        let result = greet("世界");
        assert!(result.contains("世界"));
    }

    #[tokio::test]
    async fn test_http_service_initialization() {
        // Test that HTTPService can be created and wrapped in Arc<TokioMutex>
        let http_service = Arc::new(TokioMutex::new(
            HTTPService::new().expect("Failed to create HTTP service"),
        ));
        assert!(Arc::strong_count(&http_service) == 1);
    }

    #[test]
    fn test_request_store_initialization() {
        // Test that RequestStore can be created and wrapped in Arc<Mutex>
        let request_store = Arc::new(Mutex::new(RequestStore::new()));
        assert!(Arc::strong_count(&request_store) == 1);

        // Verify store starts empty
        let store = request_store.lock().unwrap();
        assert_eq!(store.len(), 0);
    }

    #[test]
    fn test_collection_manager_initialization() {
        // Test that CollectionManager can be created with a temp directory
        let temp_dir = TempDir::new().unwrap();
        let manager = Arc::new(
            CollectionManager::new(temp_dir.path()).expect("Failed to create collection manager"),
        );
        assert!(Arc::strong_count(&manager) == 1);
    }

    #[test]
    fn test_app_state_creation() {
        // Test that AppState can be created with a CollectionManager
        let temp_dir = TempDir::new().unwrap();
        let collection_manager = Arc::new(
            CollectionManager::new(temp_dir.path()).expect("Failed to create collection manager"),
        );
        let app_state = AppState { collection_manager };
        assert!(Arc::strong_count(&app_state.collection_manager) == 1);
    }

    #[test]
    fn test_shared_state_cloning() {
        // Test that Arc allows multiple owners of the same data
        let temp_dir = TempDir::new().unwrap();
        let manager1 = Arc::new(
            CollectionManager::new(temp_dir.path()).expect("Failed to create collection manager"),
        );
        let manager2 = Arc::clone(&manager1);
        assert!(Arc::strong_count(&manager1) == 2);
        assert!(Arc::ptr_eq(&manager1, &manager2));
    }
}
