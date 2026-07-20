pub mod chaos_monkey;
pub mod sync_daemon;

#[tauri::command]
async fn print_receipt_tcp(printer_ip: String, payload: serde_json::Value) -> Result<(), String> {
    use tokio::io::AsyncWriteExt;
    use tokio::net::TcpStream;

    let mut stream = match TcpStream::connect(format!("{}:9100", printer_ip)).await {
        Ok(s) => s,
        Err(e) => {
            return Err(format!(
                "Failed to connect to printer at {}: {}",
                printer_ip, e
            ))
        }
    };

    // Construct ESC/POS byte buffer
    let mut buffer: Vec<u8> = Vec::new();

    // Init printer: ESC @
    buffer.extend_from_slice(&[0x1B, 0x40]);
    // Justification Center: ESC a 1
    buffer.extend_from_slice(&[0x1B, 0x61, 0x01]);

    // Bold on
    buffer.extend_from_slice(&[0x1B, 0x45, 0x01]);
    buffer.extend_from_slice(b"SHAHEEN TRADERS\n");
    buffer.extend_from_slice(b"B2B Wholesale Operations\n\n");
    // Bold off
    buffer.extend_from_slice(&[0x1B, 0x45, 0x00]);

    // Justification Left: ESC a 0
    buffer.extend_from_slice(&[0x1B, 0x61, 0x00]);

    let client_name = payload["client_name"].as_str().unwrap_or("Cash Sale");
    buffer.extend_from_slice(format!("Client: {}\n", client_name).as_bytes());

    let total = payload["total"].as_f64().unwrap_or(0.0);
    buffer.extend_from_slice(b"--------------------------------\n");

    if let Some(items) = payload["items"].as_array() {
        for item in items {
            let name = item["name"].as_str().unwrap_or("Item");
            let qty = item["quantity"].as_f64().unwrap_or(1.0);
            let price = item["price"].as_f64().unwrap_or(0.0);
            buffer.extend_from_slice(format!("{} x{} @ {:.2}\n", name, qty, price).as_bytes());
        }
    }

    buffer.extend_from_slice(b"--------------------------------\n");
    // Emphasize Total
    buffer.extend_from_slice(&[0x1B, 0x45, 0x01]);
    buffer.extend_from_slice(format!("TOTAL: Rs. {:.2}\n", total).as_bytes());
    buffer.extend_from_slice(&[0x1B, 0x45, 0x00]);

    buffer.extend_from_slice(b"\nThank you for your business!\n\n\n\n");

    // Partial Cut: GS V 0
    buffer.extend_from_slice(&[0x1D, 0x56, 0x42, 0x00]);

    if let Err(e) = stream.write_all(&buffer).await {
        return Err(format!("Failed to send ESC/POS payload: {}", e));
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![print_receipt_tcp])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize SQLite and start the Sync Daemon in the background
            tauri::async_runtime::spawn(async move {
                // Dummy connection for setup phase, actual SQLite path would be managed here
                let conn = std::sync::Arc::new(tokio::sync::Mutex::new(
                    rusqlite::Connection::open_in_memory().unwrap(),
                ));

                let daemon_conn = conn.clone();
                tokio::spawn(async move {
                    sync_daemon::start_sync_daemon(daemon_conn).await;
                });

                // Optional: Chaos Monkey
                // chaos_monkey::run_stress_test(conn.clone()).await;
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
