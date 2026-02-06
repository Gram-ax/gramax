use axum::http::Request;
use axum::http::Response;
use tower_http::classify::ServerErrorsFailureClass;
use tracing::Span;

use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

pub fn init() {
	let subscriber = tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| format!("{}=info", env!("CARGO_CRATE_NAME")).into());

	tracing_subscriber::registry()
		.with(tracing_subscriber::fmt::layer())
		.with(subscriber)
		.init();
}

pub trait Report {
	fn report_if_err(self) -> Self;
}

impl<T, E: std::error::Error + Send + Sync + 'static> Report for Result<T, E> {
	fn report_if_err(self) -> Self {
		if let Err(ref e) = self {
			tracing::error!(error = ?e);
		}
		self
	}
}

pub fn make_span<B>(request: &Request<B>) -> Span {
	let method = request.method();
	let uri = request.uri();
	let u = request
		.headers()
		.get("user-agent")
		.map(|v| v.to_str().unwrap_or_default())
		.unwrap_or("<none>");

	tracing::info_span!(
		"req",
		method = %method,
		uri = %uri,
		user_agent = %u,
	)
}

pub fn on_response<B: std::fmt::Debug>(response: &Response<B>, latency: std::time::Duration, span: &Span) {
	let status = response.status();

	if status.is_success() || status.is_redirection() {
		tracing::debug!(parent: span, status = %status, latency = ?latency, "-->");
	} else {
		tracing::error!(parent: span, status = %status, latency = ?latency, "-->");
	}
}

pub fn on_failure(error: ServerErrorsFailureClass, latency: std::time::Duration, span: &Span) {
	tracing::error!(parent: span, error = ?error, latency = ?latency);
}
