use std::cell::RefCell;
use std::ffi::CString;

use opentelemetry_sdk::trace::SpanData;
use tracing::level_filters::LevelFilter;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

thread_local! {
	static SPANS: RefCell<Vec<gramax_opentelemetry::OtelSpan>> = RefCell::new(Vec::new());
}

pub fn setup_remote_context(span_id: Option<&str>, trace_id: Option<&str>) -> opentelemetry::ContextGuard {
	use opentelemetry::trace::*;

	let span_id = span_id.map(|span_id| SpanId::from_hex(span_id).ok()).flatten();

	let trace_id = trace_id.map(|trace_id| TraceId::from_hex(trace_id).ok()).flatten();

	let (Some(span_id), Some(trace_id)) = (span_id, trace_id) else {
		return opentelemetry::Context::current().with_telemetry_suppressed().attach();
	};

	let context = SpanContext::new(trace_id, span_id, TraceFlags::SAMPLED, true, TraceState::default());
	opentelemetry::Context::current().with_remote_span_context(context).attach()
}

pub fn flush_spans() {
	let spans: Vec<gramax_opentelemetry::OtelSpan> = SPANS.with(|s| s.borrow_mut().drain(..).collect());
	if spans.is_empty() {
		return;
	}

	let json = serde_json::to_string(&spans).unwrap_or_default();
	let script = format!("self.postMessage({{type:'otel',spans:{json}}})");
	if let Ok(c_script) = CString::new(script) {
		unsafe { crate::ffi::emscripten_run_script(c_script.as_ptr() as *const u8) };
	}
}

#[derive(Debug)]
struct WasmOtelProcessor;

impl opentelemetry_sdk::trace::SpanProcessor for WasmOtelProcessor {
	fn on_start(&self, _span: &mut opentelemetry_sdk::trace::Span, _cx: &opentelemetry::Context) {}

	fn on_end(&self, span: SpanData) {
		SPANS.with(|s| s.borrow_mut().push(gramax_opentelemetry::OtelSpan::from(&span)));
	}

	fn force_flush(&self) -> opentelemetry_sdk::error::OTelSdkResult {
		Ok(())
	}

	fn shutdown(&self) -> opentelemetry_sdk::error::OTelSdkResult {
		Ok(())
	}

	fn shutdown_with_timeout(&self, _timeout: std::time::Duration) -> opentelemetry_sdk::error::OTelSdkResult {
		Ok(())
	}
}

pub fn init() -> Result<(), Box<dyn std::error::Error>> {
	let filter = tracing_subscriber::EnvFilter::builder()
		.with_default_directive(LevelFilter::INFO.into())
		.parse("")?;

	let otel_processor = WasmOtelProcessor;
	let provider = opentelemetry_sdk::trace::SdkTracerProvider::builder()
		.with_span_processor(otel_processor)
		.build();
	opentelemetry::global::set_tracer_provider(provider);

	let otel_layer = tracing_opentelemetry::layer()
		.with_location(false)
		.with_threads(false)
		.with_tracked_inactivity(false)
		.with_tracer(opentelemetry::global::tracer("app"));

	tracing_subscriber::registry().with(filter).with(otel_layer).init();

	Ok(())
}
