use opentelemetry::trace::*;
use opentelemetry::Context;
use opentelemetry::ContextGuard;

use tauri::ipc::CommandArg;
use tauri::Runtime;

#[allow(dead_code)]
pub struct OtelContext(ContextGuard);

unsafe impl Send for OtelContext {}

impl<'de, R: Runtime> CommandArg<'de, R> for OtelContext {
	fn from_command(command: tauri::ipc::CommandItem<'de, R>) -> Result<Self, tauri::ipc::InvokeError> {
		let Some(parent_span_id) = command
			.message
			.headers()
			.get("span-id")
			.and_then(|v| v.to_str().ok())
			.and_then(|v| SpanId::from_hex(v).ok())
		else {
			let context = Context::current().with_telemetry_suppressed().attach();
			return Ok(Self(context));
		};

		let Some(trace_id) = command
			.message
			.headers()
			.get("trace-id")
			.and_then(|v| v.to_str().ok())
			.and_then(|v| TraceId::from_hex(v).ok())
		else {
			let context = Context::current().with_telemetry_suppressed().attach();
			return Ok(Self(context));
		};

		let span_context = SpanContext::new(trace_id, parent_span_id, TraceFlags::SAMPLED, true, TraceState::default());

		if !span_context.is_valid() {
			return Err(tauri::ipc::InvokeError::from_anyhow(anyhow::anyhow!("invalid span context")));
		}

		let context = Context::current().with_remote_span_context(span_context).attach();
		Ok(Self(context))
	}
}
