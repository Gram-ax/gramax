use std::sync::atomic::AtomicU32;
use std::sync::atomic::AtomicU64;
use std::sync::Arc;
use std::sync::LazyLock;
use std::time::Duration;

use axum::extract::Request;
use axum::middleware::Next;
use axum::response::Response;
use axum::routing::get;
use axum::Json;
use axum::Router;

use prometheus_client::metrics::gauge::Gauge;
use prometheus_client::metrics::histogram::Histogram;
use prometheus_client::registry::Registry;
use sysinfo::Pid;
use sysinfo::ProcessesToUpdate;
use sysinfo::System;
use sysinfo::MINIMUM_CPU_UPDATE_INTERVAL;

use serde_json::json;
use tokio::sync::Mutex;
use tracing::*;

pub type PrometheusMetricsExt = Arc<PrometheusMetrics>;

const SYSTEM_UPDATE_INTERVAL: Duration = Duration::from_secs(2);

static PID: LazyLock<u32> = LazyLock::new(|| std::process::id());

pub struct PrometheusMetrics {
	registry: Registry,

	total_memory_usage: Gauge<u64, AtomicU64>,
	total_cpu_usage: Gauge<f32, AtomicU32>,

	memory_usage: Gauge<u64, AtomicU64>,
	cpu_usage: Gauge<f32, AtomicU32>,
	http_reqs: Histogram,

	system: Mutex<PrometheusSystemMetrics>,
}

struct PrometheusSystemMetrics {
	system: System,
	last_update: std::time::SystemTime,
}

impl PrometheusMetrics {
	pub fn new() -> Self {
		let memory_usage = Gauge::<u64, AtomicU64>::default();
		let cpu_usage = Gauge::<f32, AtomicU32>::default();
		let total_memory_usage = Gauge::<u64, AtomicU64>::default();
		let total_cpu_usage = Gauge::<f32, AtomicU32>::default();
		let http_reqs = Histogram::new(vec![0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]);

		let mut registry = Registry::default();
		registry.register("total_memory_usage", "total memory usage help", total_memory_usage.clone());
		registry.register("total_cpu_usage", "total cpu usage help", total_cpu_usage.clone());
		registry.register("memory_usage", "memory usage help", memory_usage.clone());
		registry.register("cpu_usage", "cpu usage help", cpu_usage.clone());
		registry.register("http_requests_total", "http requests total help", http_reqs.clone());

		let system = System::new();

		Self {
			registry,
			total_memory_usage,
			total_cpu_usage,
			memory_usage,
			cpu_usage,
			http_reqs,
			system: Mutex::new(PrometheusSystemMetrics {
				system,
				last_update: std::time::SystemTime::now() - MINIMUM_CPU_UPDATE_INTERVAL,
			}),
		}
	}

	pub fn track_http_req(&self, latency: std::time::Duration) {
		self.http_reqs.observe(latency.as_secs_f64());
	}

	pub async fn track_mem_cpu_usage(&self) {
		let pid = Pid::from_u32(*PID);

		let mut system = self.system.lock().await;

		if std::time::SystemTime::now()
			.duration_since(system.last_update)
			.is_ok_and(|d| d >= SYSTEM_UPDATE_INTERVAL)
		{
			system.system.refresh_cpu_usage();

			tokio::time::sleep(MINIMUM_CPU_UPDATE_INTERVAL).await;

			system.system.refresh_cpu_usage();
			system.system.refresh_memory();
			system.system.refresh_processes(ProcessesToUpdate::Some(&[pid]), false);

			system.last_update = std::time::SystemTime::now();
		} else {
			debug!("skip sysinfo refresh because it's too soon: {:?}", system.last_update.elapsed());
		}

		let mem_used_total = system.system.used_memory();
		let cpu_used_total = system.system.global_cpu_usage();
		let process = system.system.process(pid).unwrap();

		let mem_process_used = process.memory();
		let cpu_process_used = process.cpu_usage();

		drop(system);

		self.total_memory_usage.set(mem_used_total);
		self.total_cpu_usage.set(cpu_used_total);
		self.memory_usage.set(mem_process_used);
		self.cpu_usage.set(cpu_process_used);
	}
}

pub fn healthprobe() -> Router {
	Router::new()
		.route("/health", get(|| async { Json(json!({ "status": "UP", "ready": true, "live": true })) }))
		.route("/health/readiness", get(|| async { Json(json!({ "status": "UP", "ready": true })) }))
		.route("/health/liveness", get(|| async { Json(json!({ "status": "UP", "live": true })) }))
}

pub async fn prometheus_track_req(req: Request, next: Next) -> Result<Response, axum::http::StatusCode> {
	let Some(metrics) = req.extensions().get::<PrometheusMetricsExt>().cloned() else {
		error!("no metrics found in request extensions");
		return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR.into());
	};

	let now = std::time::Instant::now();

	let response = next.run(req).await;

	metrics.track_http_req(now.elapsed());

	Ok(response)
}

async fn prometheus_metrics_handler(req: Request) -> Result<String, axum::http::StatusCode> {
	let Some(metrics) = req.extensions().get::<PrometheusMetricsExt>() else {
		error!("no metrics found in request extensions");
		return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
	};

	metrics.track_mem_cpu_usage().await;

	let mut buf = String::new();
	prometheus_client::encoding::text::encode(&mut buf, &metrics.registry).map_err(|e| {
		error!("failed to encode metrics: {:#?}", e);
		axum::http::StatusCode::INTERNAL_SERVER_ERROR
	})?;

	Ok(buf)
}

pub fn prometheus_metrics() -> Router {
	Router::new().route("/metrics", get(prometheus_metrics_handler))
}
