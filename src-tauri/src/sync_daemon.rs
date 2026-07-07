use reqwest::Client;
use rusqlite::Connection;
use serde_json::json;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};

/// Configuration for Supabase
const SUPABASE_URL: &str =
    "https://xaukltifywuxuewdulfl.supabase.co/rest/v1/rpc/process_order_transaction";
const SUPABASE_KEY: &str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdWtsdGlmeXd1eHVld2R1bGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjEyMDksImV4cCI6MjA5NzYzNzIwOX0.F3OLZeZuEuBl8AHV6pyc5Hx0j-wxObu1RwNQn3yCnxI";

/// Represents an offline order waiting in the local SQLite queue
#[derive(Debug)]
struct OfflineOrder {
    id: i32,
    idempotency_key: String,
    payload: String, // The JSON payload of the order
}

enum SyncResult {
    Success,
    FailedStock,
    RetryLater,
}

/// The Sync Daemon loop
/// This function runs in the background and continuously attempts to flush the offline SQLite queue to Supabase.
pub async fn start_sync_daemon(db_conn: Arc<Mutex<Connection>>) {
    let client = Client::new();

    // Ensure the offline queue table exists
    {
        let conn = db_conn.lock().await;
        if let Err(e) = conn.execute(
            "CREATE TABLE IF NOT EXISTS local_offline_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idempotency_key TEXT UNIQUE NOT NULL,
                client_name TEXT NOT NULL,
                payload TEXT NOT NULL,
                synced INTEGER DEFAULT 0,
                status TEXT DEFAULT 'PENDING',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );",
            [],
        ) {
            eprintln!(
                "[Sync Daemon] Failed to initialize local_offline_orders table: {}",
                e
            );
        } else {
            println!("[Sync Daemon] local_offline_orders table is ready.");
            // Migration hack for existing dbs in dev mode:
            let _ = conn.execute(
                "ALTER TABLE local_offline_orders ADD COLUMN status TEXT DEFAULT 'PENDING'",
                [],
            );
        }
    }

    loop {
        // Sleep between sync attempts to avoid CPU thrashing
        sleep(Duration::from_secs(10)).await;

        let is_connected = check_internet_connection().await;
        if !is_connected {
            println!("[Sync Daemon] No internet connection. Waiting...");
            continue;
        }

        println!("[Sync Daemon] Internet connected. Checking for offline orders...");

        let orders_to_sync = match fetch_offline_orders(&db_conn).await {
            Ok(orders) => orders,
            Err(e) => {
                eprintln!("[Sync Daemon] Error fetching offline orders: {}", e);
                continue;
            }
        };

        if orders_to_sync.is_empty() {
            continue;
        }

        println!(
            "[Sync Daemon] Found {} orders to sync.",
            orders_to_sync.len()
        );

        for order in orders_to_sync {
            println!(
                "[Sync Daemon] Attempting to sync order {} (Idempotency Key: {})",
                order.id, order.idempotency_key
            );
            let result = push_order_to_supabase(&client, &order).await;

            match result {
                SyncResult::Success => {
                    // Remove from local queue if successful or if Supabase rejected it specifically for being a duplicate (Idempotent)
                    if let Err(e) = remove_offline_order(&db_conn, order.id).await {
                        eprintln!(
                            "[Sync Daemon] Failed to remove synced order {}: {}",
                            order.id, e
                        );
                    } else {
                        println!(
                            "[Sync Daemon] Order {} synced & removed from queue.",
                            order.id
                        );
                    }
                }
                SyncResult::FailedStock => {
                    eprintln!("[Sync Daemon] Order {} failed due to insufficient stock! Marking as FAILED_STOCK.", order.id);
                    if let Err(e) = mark_order_failed(&db_conn, order.id, "FAILED_STOCK").await {
                        eprintln!(
                            "[Sync Daemon] Failed to update status for order {}: {}",
                            order.id, e
                        );
                    }
                }
                SyncResult::RetryLater => {
                    eprintln!(
                        "[Sync Daemon] Failed to sync order {}. Will retry later.",
                        order.id
                    );
                    // Break out of the loop and try the whole batch later to preserve ordering if needed
                    break;
                }
            }
        }
    }
}

/// Simple connection check
async fn check_internet_connection() -> bool {
    // Ping a highly available endpoint
    reqwest::get("https://1.1.1.1").await.is_ok()
}

/// Fetch all pending orders from the local SQLite `local_offline_orders` table
async fn fetch_offline_orders(
    db_conn: &Arc<Mutex<Connection>>,
) -> Result<Vec<OfflineOrder>, rusqlite::Error> {
    let conn = db_conn.lock().await;
    let mut stmt = conn.prepare("SELECT id, idempotency_key, payload FROM local_offline_orders WHERE status = 'PENDING' ORDER BY created_at ASC")?;

    let order_iter = stmt.query_map([], |row| {
        Ok(OfflineOrder {
            id: row.get(0)?,
            idempotency_key: row.get(1)?,
            payload: row.get(2)?,
        })
    })?;

    let mut orders = Vec::new();
    for order in order_iter {
        orders.push(order?);
    }

    Ok(orders)
}

/// Pushes the order JSON payload to the Supabase RPC endpoint
async fn push_order_to_supabase(client: &Client, order: &OfflineOrder) -> SyncResult {
    // The payload string from SQLite is already JSON, we parse it to send as JSON body
    let payload_json: serde_json::Value = match serde_json::from_str(&order.payload) {
        Ok(v) => v,
        Err(_) => return SyncResult::RetryLater, // Corrupted payload
    };

    let response = client
        .post(SUPABASE_URL)
        .header("apikey", SUPABASE_KEY)
        .header("Authorization", format!("Bearer {}", SUPABASE_KEY))
        .json(&json!({ "payload": payload_json })) // Wrapping in the RPC argument name
        .send()
        .await;

    match response {
        Ok(res) => {
            if res.status().is_success() {
                let body: serde_json::Value = res.json().await.unwrap_or_default();
                if body["success"] == true
                    || body["error"].as_str().unwrap_or("").contains("Idempotency")
                {
                    return SyncResult::Success;
                } else if body["error_code"] == "ERR_INSUFFICIENT_STOCK" {
                    return SyncResult::FailedStock;
                }
            }
            SyncResult::RetryLater
        }
        Err(_) => SyncResult::RetryLater,
    }
}

/// Deletes the order from the local SQLite queue after successful sync
async fn remove_offline_order(
    db_conn: &Arc<Mutex<Connection>>,
    order_id: i32,
) -> Result<(), rusqlite::Error> {
    let conn = db_conn.lock().await;
    conn.execute("DELETE FROM local_offline_orders WHERE id = ?1", [order_id])?;
    Ok(())
}

/// Marks the order as failed locally so it stops blocking the queue
async fn mark_order_failed(
    db_conn: &Arc<Mutex<Connection>>,
    order_id: i32,
    status: &str,
) -> Result<(), rusqlite::Error> {
    let conn = db_conn.lock().await;
    conn.execute(
        "UPDATE local_offline_orders SET status = ?1 WHERE id = ?2",
        rusqlite::params![status, order_id],
    )?;
    Ok(())
}
