pub mod chaos_monkey {
    use rusqlite::Connection;
    use std::sync::Arc;
    use tokio::sync::Mutex;
    use tokio::time::{sleep, Duration};
    use uuid::Uuid;

    /// Runs a stress test against the local SQLite queue to ensure the sync daemon
    /// can handle extreme bursts of transactions without data loss or corruption.
    pub async fn run_stress_test(db_conn: Arc<Mutex<Connection>>) {
        println!("[Chaos Monkey] Starting Offline Queue Stress Test...");

        // Spawn a thread to rapidly insert orders
        let db_clone = Arc::clone(&db_conn);
        tokio::spawn(async move {
            for i in 1..=1000 {
                let idempotency_key = Uuid::new_v4().to_string();
                // Synthetic JSON payload for the RPC
                let payload = format!(
                    r#"{{ 
                    "receipt_number": "CM-{}", 
                    "idempotency_key": "{}", 
                    "client_name": "Chaos Monkey Script", 
                    "total_amount": 100, 
                    "items": [] 
                }}"#,
                    i, idempotency_key
                );

                {
                    let conn = db_clone.lock().await;
                    if let Err(e) = conn.execute(
                        "INSERT INTO local_offline_orders (idempotency_key, client_name, payload, status) VALUES (?1, ?2, ?3, 'PENDING')",
                        rusqlite::params![idempotency_key, "Chaos Monkey Script", payload],
                    ) {
                        eprintln!("[Chaos Monkey] Failed to insert synthetic order {}: {}", i, e);
                    }
                }

                // Randomly sleep to simulate bursty cashier operations
                if i % 15 == 0 {
                    sleep(Duration::from_millis(50)).await;
                }
            }
            println!("[Chaos Monkey] Finished inserting 1,000 synthetic orders.");
        });
    }
}
