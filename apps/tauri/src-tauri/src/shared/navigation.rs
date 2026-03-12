use tracing_opentelemetry::OpenTelemetrySpanExt;

#[instrument(skip_all, fields(url = url.as_str()))]
pub fn should_allow_navigation(url: &url::Url, allowed_domains: &[&str]) -> bool {
	let ok = url.scheme() == "blob"
		|| url.scheme() == "about"
		|| url.scheme() == "tauri"
		|| url.domain().is_some_and(|domain| allowed_domains.contains(&domain));

	tracing::Span::current().set_attribute("allowed", ok);

	ok
}
