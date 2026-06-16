use base64::Engine;
use std::fs;
use std::path::PathBuf;
use std::time::SystemTime;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

fn get_suppliers_dir(app: &tauri::AppHandle) -> PathBuf {
    let mut path = app
        .path()
        .app_data_dir()
        .expect("failed to resolve app data dir");
    path.push("suppliers");
    fs::create_dir_all(&path).ok();
    path
}

#[tauri::command]
fn save_supplier_image(app: tauri::AppHandle, data: String, ext: String) -> Result<String, String> {
    let bytes =
        base64::engine::general_purpose::STANDARD
            .decode(&data)
            .map_err(|e| e.to_string())?;

    let timestamp = SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let filename = format!("{}.{}", timestamp, ext);
    let suppliers_dir = get_suppliers_dir(&app);
    let filepath = suppliers_dir.join(&filename);
    fs::write(&filepath, &bytes).map_err(|e| e.to_string())?;
    Ok(format!("/suppliers/{}", filename))
}

#[tauri::command]
fn restore_database(app: tauri::AppHandle, backup_path: String) -> Result<(), String> {
    let mut db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    db_path.push("mydatabase.db");

    let temp_path = db_path.with_extension("db.tmp");

    fs::copy(&backup_path, &temp_path).map_err(|e| e.to_string())?;
    fs::rename(&temp_path, &db_path).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn save_csv_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, &content).map_err(|e| e.to_string())
}

#[tauri::command]
fn close_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn get_supplier_image_base64(app: tauri::AppHandle, path: String) -> Result<String, String> {
    let suppliers_dir = get_suppliers_dir(&app);
    let filename = path.trim_start_matches("/suppliers/");
    let filepath = suppliers_dir.join(filename);

    if !filepath.exists() {
        return Err("not found".to_string());
    }

    let bytes = fs::read(&filepath).map_err(|e| e.to_string())?;
    let ext = filepath
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        _ => "image/png",
    };
    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", mime, b64))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/001_initial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_profit_to_sales",
            sql: include_str!("../migrations/002_profit.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:mydatabase.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            save_supplier_image,
            get_supplier_image_base64,
            restore_database,
            save_csv_file,
            close_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
