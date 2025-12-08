use axum::routing::get;
use axum::Json;
use axum::Router;

use serde_json::json;

pub fn healthprobe() -> Router {
  Router::new()
    .route("/health", get(|| async { Json(json!({ "status": "UP", "ready": true, "live": true })) }))
    .route("/health/readiness", get(|| async { Json(json!({ "status": "UP", "ready": true })) }))
    .route("/health/liveness", get(|| async { Json(json!({ "status": "UP", "live": true })) }))
}
