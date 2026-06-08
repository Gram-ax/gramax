use tauri::http::HeaderMap;
use opentelemetry::trace::*;
use opentelemetry::Context;
use opentelemetry::ContextGuard;

use tauri::ipc::CommandArg;
use tauri::Runtime;

#[allow(dead_code)]
pub struct OtelContext(ContextGuard);

unsafe impl Send for OtelContext {}

impl OtelContext {
	pub fn from_headers(headers: &HeaderMap) -> Self {
		let parent_span_id = headers
			.get("span-id")
			.and_then(|v| v.to_str().ok())
			.and_then(|v| SpanId::from_hex(v).ok());

		let trace_id = headers
			.get("trace-id")
			.and_then(|v| v.to_str().ok())
			.and_then(|v| TraceId::from_hex(v).ok());

		let span_context = match (parent_span_id, trace_id) {
			(Some(span), Some(trace)) => {
				let ctx = SpanContext::new(trace, span, TraceFlags::SAMPLED, true, TraceState::default());
				ctx.is_valid().then_some(ctx)
			}
			_ => None,
		};

		match span_context {
			Some(ctx) => Self(Context::current().with_remote_span_context(ctx).attach()),
			None => Self(Context::current().with_telemetry_suppressed().attach()),
		}
	}
}

impl<'de, R: Runtime> CommandArg<'de, R> for OtelContext {
	fn from_command(command: tauri::ipc::CommandItem<'de, R>) -> Result<Self, tauri::ipc::InvokeError> {
		Ok(Self::from_headers(command.message.headers()))
	}
}
