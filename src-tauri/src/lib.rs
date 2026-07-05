use base64::Engine;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
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
    let bytes = base64::engine::general_purpose::STANDARD
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
    if backup_path.trim().is_empty() {
        return Err("La ruta del archivo de backup no puede estar vacía".to_string());
    }

    let backup_path_obj = Path::new(&backup_path);
    if !backup_path_obj.is_file() {
        return Err("La ruta especificada no existe o no es un archivo válido".to_string());
    }

    let mut file = fs::File::open(backup_path_obj)
        .map_err(|e| format!("No se pudo abrir el backup: {}", e))?;
    
    let mut header = [0u8; 16];
    let bytes_read = file.read(&mut header).map_err(|e| e.to_string())?;
    
    if bytes_read < 16 || &header != b"SQLite format 3\x00" {
        return Err("El archivo no es una base de datos SQLite válida (header incorrecto)".to_string());
    }
    drop(file); 

    let mut db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Error al obtener directorio de datos: {}", e))?;
    db_path.push("mydatabase.db");

    fs::copy(&backup_path, &db_path)
        .map_err(|e| format!("Error crítico al sobreescribir la base de datos: {}", e))?;

    println!("Base de datos reemplazada exitosamente desde: {}", backup_path);
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
fn restart_app(app_handle: tauri::AppHandle) {
    app_handle.restart(); 
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
            close_app,
            restart_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}