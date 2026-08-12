#![cfg(not(target_family = "wasm"))]

use napi::Error;
use serde::Serialize;

#[macro_use]
extern crate napi_derive;

pub mod fs;
pub mod git;

pub type Output = std::result::Result<String, Error>;
pub type AsyncOutput = napi::bindgen_prelude::Result<String>;

pub trait JsonExt {
	fn json(&self) -> Output;
}

impl<T: Serialize, E: Serialize> JsonExt for Result<T, E> {
	fn json(&self) -> Output {
		match self {
			Ok(ok) => serde_json::to_string(ok).map_err(|e| Error::from_reason(e.to_string())),
			Err(err) => Err(
				serde_json::to_string(err)
					.map(Error::from_reason)
					.unwrap_or_else(|e| Error::from_reason(e.to_string())),
			),
		}
	}
}

#[derive(Debug)]
struct StderrJsonExporter;

impl opentelemetry_sdk::trace::SpanExporter for StderrJsonExporter {
	async fn export(&self, batch: Vec<opentelemetry_sdk::trace::SpanData>) -> opentelemetry_sdk::error::OTelSdkResult {
		for span in &batch {
			let otel = gramax_opentelemetry::OtelSpan::from(span);
			if let Ok(json) = serde_json::to_string(&otel) {
				eprintln!("{json}");
			}
		}
		Ok(())
	}
}

pub fn setup_remote_context(span_id: Option<&str>, trace_id: Option<&str>) -> opentelemetry::ContextGuard {
	use opentelemetry::trace::*;

	let span_id = span_id.and_then(|s| SpanId::from_hex(s).ok());
	let trace_id = trace_id.and_then(|s| TraceId::from_hex(s).ok());

	let (Some(span_id), Some(trace_id)) = (span_id, trace_id) else {
		return opentelemetry::Context::current().with_telemetry_suppressed().attach();
	};

	let context = SpanContext::new(trace_id, span_id, TraceFlags::SAMPLED, true, TraceState::default());
	opentelemetry::Context::current().with_remote_span_context(context).attach()
}

#[ctor::ctor(unsafe)]
fn init() {
	use tracing_subscriber::layer::SubscriberExt;
	use tracing_subscriber::util::SubscriberInitExt;

	let env_filter = tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or(tracing_subscriber::EnvFilter::new("info"));

	let provider = opentelemetry_sdk::trace::SdkTracerProvider::builder()
		.with_sampler(opentelemetry_sdk::trace::Sampler::ParentBased(Box::new(
			opentelemetry_sdk::trace::Sampler::AlwaysOff,
		)))
		.with_simple_exporter(StderrJsonExporter)
		.build();
	opentelemetry::global::set_tracer_provider(provider);

	tracing_subscriber::registry()
		.with(env_filter)
		.with(
			tracing_opentelemetry::layer()
				.with_location(false)
				.with_threads(false)
				.with_tracked_inactivity(false)
				.with_tracer(opentelemetry::global::tracer("app")),
		)
		.init();
}
