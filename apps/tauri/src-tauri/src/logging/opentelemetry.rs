use std::io::BufWriter;
use std::io::Write;
use std::sync::mpsc;

use gramax_opentelemetry::OtelSpan;
use opentelemetry_sdk::trace::SdkTracerProvider;
use opentelemetry_sdk::trace::SpanData;
use tauri::*;
use tracing::Subscriber;
use tracing_subscriber::{registry::LookupSpan, Layer};

enum LogMessage {
	SerializedSpan { stderr: String, json: String },
	JsSerializedSpan(Vec<String>),
}

#[derive(Clone)]
pub struct LogSender(mpsc::Sender<LogMessage>);

pub fn spawn_log_writer(mut file: BufWriter<std::fs::File>) -> LogSender {
	let (tx, rx) = mpsc::channel::<LogMessage>();

	std::thread::Builder::new()
		.name("otel-log-writer".into())
		.spawn(move || {
			for msg in rx {
				match msg {
					LogMessage::SerializedSpan { stderr, json } => {
						eprintln!("{stderr}");
						let _ = writeln!(file, "{json}");
					}
					LogMessage::JsSerializedSpan(lines) => {
						for json in lines {
							let _ = writeln!(file, "{json}");
						}
					}
				}
			}
		})
		.expect("failed to spawn otel-log-writer thread");

	LogSender(tx)
}

#[derive(Debug)]
pub struct OTelMultiExporter<R: Runtime> {
	app: AppHandle<R>,
	log_tx: mpsc::Sender<LogMessage>,
}

impl<R: Runtime> opentelemetry_sdk::trace::SpanExporter for OTelMultiExporter<R> {
	async fn export(&self, batch: Vec<SpanData>) -> opentelemetry_sdk::error::OTelSdkResult {
		for span in &batch {
			let otel_span = OtelSpan::from(span);

			let stderr = format!("{}", StderrFmt(span));
			let json = serde_json::to_string(&otel_span).unwrap_or_default();

			let _ = self.log_tx.send(LogMessage::SerializedSpan { stderr, json });
			let _ = self.app.emit("otel-rust", &otel_span);
		}
		Ok(())
	}
}

struct StderrFmt<'s>(&'s SpanData);

impl std::fmt::Display for StderrFmt<'_> {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		use colored::Colorize;

		let span = self.0;
		let duration = span.end_time.duration_since(span.start_time).unwrap_or_default();

		let target = span.attributes.iter().find(|a| a.key.as_str() == "target");
		let target_prefix = target.map(|t| format!("{}::", t.value)).unwrap_or_default();

		write!(f, "{}{} ({duration:?})", target_prefix.dimmed(), span.name.bold())?;

		let ids = format!(
			"(trace: {}, span: {}, parent: {})",
			span.span_context.trace_id(),
			span.span_context.span_id(),
			if span.parent_span_id == opentelemetry::trace::SpanId::INVALID {
				"none".to_string()
			} else {
				span.parent_span_id.to_string()
			},
		);
		write!(f, " {}", ids.dimmed())?;

		let attrs: Vec<_> = span.attributes.iter().filter(|a| a.key.as_str() != "target").collect();
		if !attrs.is_empty() {
			write!(f, "\n")?;
			for attr in &attrs {
				write!(f, "{}: {} ", attr.key.as_str().bold(), attr.value)?;
			}
		}

		if !span.events.is_empty() {
			write!(f, "\n{}", "events".black().on_white())?;
		}

		for event in span.events.iter() {
			let is_error = event.name == "exception";
			let since = event.timestamp.duration_since(span.start_time).unwrap_or_default();

			let level = event
				.attributes
				.iter()
				.find(|a| a.key.as_str() == "level")
				.map(|a| a.value.as_str().to_string())
				.unwrap_or_default();

			let level_colored = match level.as_str() {
				"WARN" => "warn".yellow(),
				"ERROR" => "error".red(),
				"DEBUG" => "debug".blue(),
				"TRACE" => "trace".cyan(),
				_ => "info".white(),
			};

			let event_name = if is_error {
				event
					.attributes
					.iter()
					.find(|a| a.key.as_str() == "exception.message")
					.map(|a| a.value.to_string())
					.unwrap_or_default()
			} else {
				event.name.to_string()
			};

			write!(f, "\n ({level_colored} at {since:?}) {event_name}")?;

			let extra: Vec<_> = event
				.attributes
				.iter()
				.filter(|a| !matches!(a.key.as_str(), "level" | "exception.message" | "target"))
				.collect();

			if extra.len() > 5 {
				writeln!(f)?;
				for attr in &extra {
					writeln!(f, "\t{}: {}", attr.key.as_str().bold(), attr.value)?;
				}
			} else {
				for attr in &extra {
					write!(f, " {}: {}", attr.key.as_str().bold(), attr.value)?;
				}
			}
		}

		writeln!(f)
	}
}

pub fn register_js_listener<R: Runtime>(app: &AppHandle<R>, log_sender: LogSender) {
	let tx = log_sender.0;
	app.listen("otel", move |event| {
		let spans: Vec<OtelSpan> = match serde_json::from_str(event.payload()) {
			Ok(s) => s,
			Err(e) => {
				eprintln!("Failed to deserialize JS otel spans: {e}");
				return;
			}
		};

		let lines: Vec<String> = spans.iter().filter_map(|span| serde_json::to_string(span).ok()).collect();

		let _ = tx.send(LogMessage::JsSerializedSpan(lines));
	});
}

pub fn open_telemetry<R: Runtime, S: Send + Sync + for<'span> LookupSpan<'span> + Subscriber>(
	app: AppHandle<R>,
	log_sender: LogSender,
) -> impl Layer<S> {
	let provider = SdkTracerProvider::builder()
		.with_simple_exporter(OTelMultiExporter { app, log_tx: log_sender.0 })
		.build();

	opentelemetry::global::set_tracer_provider(provider);

	tracing_opentelemetry::layer()
		.with_location(false)
		.with_threads(false)
		.with_tracked_inactivity(false)
		.with_tracer(opentelemetry::global::tracer("app"))
}
