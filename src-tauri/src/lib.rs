pub mod commands;
pub mod models;
pub mod services;
pub mod storage;

use commands::collections::{
    create_new_collection, delete_collection, list_collections, load_collection,
    open_collection_dialog, save_collection, validate_collection, AppState,
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
            validate_collection
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

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
}
