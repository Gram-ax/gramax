use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;

use serde::{de::DeserializeOwned, Deserialize, Serialize};
use tauri::{Manager, PhysicalPosition, PhysicalSize, RunEvent, Runtime, Size, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent};
use tokio::sync::oneshot;
use tokio::time::timeout;
use tracing::{info, warn};

rust_i18n::i18n!("locales");

const WINDOW_LABEL_PREFIX: &str = "browser-session";
const WINDOW_INSET_PX: i32 = 40;
const COMMAND_TIMEOUT: Duration = Duration::from_secs(5);
const READINESS_ATTEMPTS: usize = 10;
const READINESS_DELAY_MS: u64 = 300;
const STABILIZATION_DELAY_MS: u64 = 700;
const COLLECTOR_RETRY_ATTEMPTS: usize = 2;
const SNAPSHOT_ATTEMPTS: usize = 3;
const SNAPSHOT_RETRY_DELAY_MS: u64 = 500;
const EMPTY_ACCESSIBILITY_TREE: &str = "Empty";
const DEBUG_MESSAGE_LIMIT: usize = 240;
const INIT_SCRIPT: &str = include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/scripts/init.js"));

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentBrowserInteractiveElement {
	pub tag: String,
	pub text: String,
	pub href: Option<String>,
	pub src: Option<String>,
	pub placeholder: Option<String>,
	pub disabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentBrowserPageSnapshot {
	pub url: String,
	pub title: String,
	pub accessibility_tree: String,
	pub is_bottom_reached: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentBrowserElementSnapshot {
	pub element_id: String,
	pub element: Option<AgentBrowserInteractiveElement>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentBrowserSessionMeta {
	pub active: bool,
	pub visible: bool,
}

#[derive(Debug, Clone)]
struct BrowserSession {
	label: String,
	visible: bool,
}

#[derive(Default)]
struct BrowserSessionState {
	sessions: Mutex<HashMap<String, BrowserSession>>,
	pending_requests: Mutex<HashMap<String, oneshot::Sender<String>>>,
	closing_labels: Mutex<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct BrowserCommandEnvelope<T> {
	ok: bool,
	result: Option<T>,
	error: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AgentBrowserRequest<'a> {
	action: &'a str,
	payload: serde_json::Value,
}

impl BrowserSessionState {
	fn meta(&self, agent_session_id: &str) -> AgentBrowserSessionMeta {
		let sessions = self.sessions.lock().unwrap();
		match sessions.get(agent_session_id) {
			Some(session) => AgentBrowserSessionMeta {
				active: true,
				visible: session.visible,
			},
			None => AgentBrowserSessionMeta {
				active: false,
				visible: false,
			},
		}
	}

	fn upsert(&self, agent_session_id: &str, session: BrowserSession) {
		self.sessions.lock().unwrap().insert(agent_session_id.to_string(), session);
	}

	fn get(&self, agent_session_id: &str) -> Option<BrowserSession> {
		self.sessions.lock().unwrap().get(agent_session_id).cloned()
	}

	fn remove(&self, agent_session_id: &str) -> Option<BrowserSession> {
		self.sessions.lock().unwrap().remove(agent_session_id)
	}

	fn set_visible(&self, agent_session_id: &str, visible: bool) {
		if let Some(session) = self.sessions.lock().unwrap().get_mut(agent_session_id) {
			session.visible = visible;
		}
	}

	fn session_id_by_label(&self, label: &str) -> Option<String> {
		self
			.sessions
			.lock()
			.unwrap()
			.iter()
			.find_map(|(session_id, session)| (session.label == label).then(|| session_id.clone()))
	}

	fn insert_pending_request(&self, request_id: String, sender: oneshot::Sender<String>) {
		self.pending_requests.lock().unwrap().insert(request_id, sender);
	}

	fn resolve_pending_request(&self, request_id: &str, payload: String) -> bool {
		let sender = self.pending_requests.lock().unwrap().remove(request_id);
		if let Some(sender) = sender {
			let _ = sender.send(payload);
			return true;
		}
		false
	}

	fn remove_pending_request(&self, request_id: &str) {
		self.pending_requests.lock().unwrap().remove(request_id);
	}

	fn mark_closing_label(&self, label: String) {
		let mut labels = self.closing_labels.lock().unwrap();
		if !labels.iter().any(|item| item == &label) {
			labels.push(label);
		}
	}

	fn consume_closing_label(&self, label: &str) -> bool {
		let mut labels = self.closing_labels.lock().unwrap();
		if let Some(index) = labels.iter().position(|item| item == label) {
			labels.remove(index);
			return true;
		}
		false
	}
}

trait AppHandleExt<R: Runtime> {
	fn get_focused_webview(&self) -> Option<WebviewWindow<R>>;
}

impl<R: Runtime> AppHandleExt<R> for tauri::AppHandle<R> {
	fn get_focused_webview(&self) -> Option<WebviewWindow<R>> {
		self.webview_windows().values().find(|wv| wv.is_focused().unwrap_or_default()).cloned()
	}
}

mod commands {
	use tauri::*;
	use tauri_otel_context::OtelContext;

	use super::*;

	#[command(async)]
	pub async fn get_session_meta<R: Runtime>(
		_otel: OtelContext,
		app: AppHandle<R>,
		agent_session_id: String,
	) -> std::result::Result<AgentBrowserSessionMeta, String> {
		Ok(get_state(&app).meta(&agent_session_id))
	}

	#[command(async)]
	pub async fn resolve_request<R: Runtime>(
		_otel: OtelContext,
		app: AppHandle<R>,
		request_id: String,
		payload: String,
	) -> std::result::Result<(), String> {
		let resolved = get_state(&app).resolve_pending_request(&request_id, payload);
		if !resolved {
			warn!(request_id, "agent-browser resolve request without waiter");
		}
		Ok(())
	}

	#[command(async)]
	pub async fn debug_log(_otel: OtelContext, label: Option<String>, message: String) -> std::result::Result<(), String> {
		info!(label, message, "agent-browser-js");
		Ok(())
	}

	#[command(async)]
	pub async fn ensure_session<R: Runtime>(
		_otel: OtelContext,
		app: AppHandle<R>,
		agent_session_id: String,
		language: Option<String>,
	) -> std::result::Result<AgentBrowserSessionMeta, String> {
		let _ = ensure_browser_session(&app, &agent_session_id, language.as_deref())?;
		Ok(get_state(&app).meta(&agent_session_id))
	}

	#[command(async)]
	pub async fn navigate<R: Runtime>(
		_otel: OtelContext,
		app: AppHandle<R>,
		agent_session_id: String,
		url: String,
	) -> std::result::Result<AgentBrowserPageSnapshot, String> {
		navigate_session(&app, &agent_session_id, &url).await
	}

	#[command(async)]
	pub async fn read_page<R: Runtime>(
		_otel: OtelContext,
		app: AppHandle<R>,
		agent_session_id: String,
	) -> std::result::Result<AgentBrowserPageSnapshot, String> {
		read_page_snapshot(&app, &agent_session_id).await
	}

	#[command(async)]
	pub async fn read_element<R: Runtime>(
		_otel: OtelContext,
		app: AppHandle<R>,
		agent_session_id: String,
		element_id: String,
	) -> std::result::Result<AgentBrowserElementSnapshot, String> {
		read_element_snapshot(&app, &agent_session_id, &element_id).await
	}

	#[command(async)]
	pub async fn click<R: Runtime>(
		_otel: OtelContext,
		app: AppHandle<R>,
		agent_session_id: String,
		element_id: String,
	) -> std::result::Result<AgentBrowserPageSnapshot, String> {
		click_element(&app, &agent_session_id, &element_id).await
	}

	#[command(async, rename = "type")]
	pub async fn type_command<R: Runtime>(
		_otel: OtelContext,
		app: AppHandle<R>,
		agent_session_id: String,
		element_id: String,
		text: String,
	) -> std::result::Result<AgentBrowserPageSnapshot, String> {
		type_text(&app, &agent_session_id, &element_id, &text).await
	}

	#[command(async)]
	pub async fn scroll<R: Runtime>(
		_otel: OtelContext,
		app: AppHandle<R>,
		agent_session_id: String,
	) -> std::result::Result<AgentBrowserPageSnapshot, String> {
		scroll_page(&app, &agent_session_id).await
	}

	#[command(async)]
	pub async fn reveal<R: Runtime>(
		_otel: OtelContext,
		app: AppHandle<R>,
		agent_session_id: String,
	) -> std::result::Result<AgentBrowserSessionMeta, String> {
		reveal_session(&app, &agent_session_id)?;
		Ok(get_state(&app).meta(&agent_session_id))
	}

	#[command(async)]
	pub async fn teardown<R: Runtime>(_otel: OtelContext, app: AppHandle<R>, agent_session_id: String) -> std::result::Result<(), String> {
		teardown_session(&app, &agent_session_id)
	}
}

//MR-16035: user can only hide browser window, only agentic loop decides to destroy window truly
fn handle_window_event<R: Runtime>(app: &tauri::AppHandle<R>, label: &str, event: &WindowEvent) {
	let state = get_state(app);
	let Some(agent_session_id) = state.session_id_by_label(label) else {
		return;
	};

	match event {
		WindowEvent::CloseRequested { api, .. } => {
			if state.consume_closing_label(label) {
				return;
			}
			api.prevent_close();
			if let Some(window) = app.get_webview_window(label) {
				let _ = window.hide();
			}
			state.set_visible(&agent_session_id, false);
		}
		WindowEvent::Destroyed => {
			let _ = state.remove(&agent_session_id);
		}
		WindowEvent::Focused(focused) => {
			state.set_visible(&agent_session_id, *focused || state.meta(&agent_session_id).visible);
		}
		_ => {}
	}
}

fn get_state<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::State<'_, BrowserSessionState> {
	app.state::<BrowserSessionState>()
}

fn build_label(agent_session_id: &str) -> String {
	let normalized: String = agent_session_id
		.chars()
		.map(|char| match char {
			'a'..='z' | 'A'..='Z' | '0'..='9' | '-' | '/' | ':' | '_' => char,
			_ => '_',
		})
		.collect();
	format!("{WINDOW_LABEL_PREFIX}-{normalized}")
}

fn truncate_debug_text(text: &str, limit: usize) -> String {
	if text.chars().count() <= limit {
		return text.to_string();
	}

	let truncated: String = text.chars().take(limit).collect();
	format!("{truncated}...")
}

fn snapshot_failure_reason(reason: &str, error: &str) -> String {
	format!("{reason}: {}", truncate_debug_text(error.trim(), DEBUG_MESSAGE_LIMIT))
}

fn make_browser_session_on_page_load_callback<R: Runtime>() -> Box<dyn Fn(WebviewWindow<R>, tauri::webview::PageLoadPayload) + Send + Sync> {
	Box::new(|window, payload| {
		info!(
			label = window.label(),
			url = payload.url().as_str(),
			event = ?payload.event(),
			"agent-browser page-load"
		);
	})
}

fn make_browser_session_on_navigation_callback(label: String) -> Box<dyn Fn(&url::Url) -> bool + Send + Sync> {
	Box::new(move |url| {
		info!(label, url = url.as_str(), "agent-browser navigation");
		true
	})
}

fn ensure_browser_session<R: Runtime>(app: &tauri::AppHandle<R>, agent_session_id: &str, language: Option<&str>) -> Result<WebviewWindow<R>, String> {
	if let Some(session) = get_state(app).get(agent_session_id) {
		if let Some(window) = app.get_webview_window(&session.label) {
			info!(agent_session_id, label = session.label, "agent-browser reusing existing session");
			return Ok(window);
		}
	}

	let previously_focused = app.get_focused_webview();
	let label = build_label(agent_session_id);
	let url = url::Url::parse("about:blank").map_err(|error| error.to_string())?;
	let title = match language {
		Some(locale) => rust_i18n::t!("browser-session.window-title", locale = locale),
		None => rust_i18n::t!("browser-session.window-title"),
	};
	let builder = WebviewWindowBuilder::new(app, label.clone(), WebviewUrl::External(url))
		.title(title)
		.visible(false)
		.focused(false)
		.accept_first_mouse(true)
		.inner_size(1000.0, 700.0)
		.initialization_script(INIT_SCRIPT)
		.on_page_load(make_browser_session_on_page_load_callback())
		.on_navigation(make_browser_session_on_navigation_callback(label.clone()));

	#[cfg(target_os = "windows")]
	let builder = builder.additional_browser_args("--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection");

	let window = builder.build().map_err(|error| error.to_string())?;
	info!(agent_session_id, label, "agent-browser window created");

	window.hide().map_err(|error| error.to_string())?;
	if let Some(focused) = previously_focused {
		let _ = focused.set_focus();
	}

	get_state(app).upsert(agent_session_id, BrowserSession { label, visible: false });

	Ok(window)
}

fn reveal_session<R: Runtime>(app: &tauri::AppHandle<R>, agent_session_id: &str) -> Result<(), String> {
	let window = ensure_browser_session(app, agent_session_id, None)?;
	apply_revealed_bounds(app, &window)?;
	window.show().map_err(|error| error.to_string())?;
	window.unminimize().map_err(|error| error.to_string())?;
	window.set_focus().map_err(|error| error.to_string())?;
	get_state(app).set_visible(agent_session_id, true);
	Ok(())
}

fn teardown_session<R: Runtime>(app: &tauri::AppHandle<R>, agent_session_id: &str) -> Result<(), String> {
	let Some(session) = get_state(app).remove(agent_session_id) else {
		return Ok(());
	};
	if let Some(window) = app.get_webview_window(&session.label) {
		get_state(app).mark_closing_label(session.label.clone());
		window.close().map_err(|error| error.to_string())?;
	}
	Ok(())
}

async fn navigate_session<R: Runtime>(app: &tauri::AppHandle<R>, agent_session_id: &str, url: &str) -> Result<AgentBrowserPageSnapshot, String> {
	info!(agent_session_id, url, "agent-browser navigate start");
	let window = ensure_browser_session(app, agent_session_id, None)?;
	let parsed = url::Url::parse(url).map_err(|error| error.to_string())?;
	if !matches!(parsed.scheme(), "http" | "https") {
		return Err("agent/browser/navigate: invalid_scheme".to_string());
	}
	window.navigate(parsed).map_err(|error| error.to_string())?;
	let _ = wait_until_document_ready(app, &window).await;
	ensure_collector(&window)?;
	let _ = stabilize(app, &window).await;
	info!(agent_session_id, "agent-browser navigate snapshot requested");
	wait_for_snapshot_or_fallback(app, &window, "navigate").await
}

async fn read_page_snapshot<R: Runtime>(app: &tauri::AppHandle<R>, agent_session_id: &str) -> Result<AgentBrowserPageSnapshot, String> {
	let window = ensure_browser_session(app, agent_session_id, None)?;
	let _ = wait_until_document_ready(app, &window).await;
	ensure_collector(&window)?;
	wait_for_snapshot_or_fallback(app, &window, "read_page").await
}

async fn read_element_snapshot<R: Runtime>(
	app: &tauri::AppHandle<R>,
	agent_session_id: &str,
	element_id: &str,
) -> Result<AgentBrowserElementSnapshot, String> {
	let window = ensure_browser_session(app, agent_session_id, None)?;
	let _ = wait_until_document_ready(app, &window).await;
	ensure_collector(&window)?;
	match execute_collector_json(
		app,
		&window,
		"read_element",
		serde_json::json!({
			"elementId": element_id,
		}),
	)
	.await
	{
		Ok(result) => Ok(result),
		Err(error) => {
			warn!(
				label = window.label(),
				element_id, error, "agent-browser read-element failed, returning null element"
			);
			Ok(AgentBrowserElementSnapshot {
				element_id: element_id.to_string(),
				element: None,
			})
		}
	}
}

async fn click_element<R: Runtime>(app: &tauri::AppHandle<R>, agent_session_id: &str, element_id: &str) -> Result<AgentBrowserPageSnapshot, String> {
	let window = ensure_browser_session(app, agent_session_id, None)?;
	ensure_collector(&window)?;
	if let Err(error) = execute_collector_json::<R, bool>(
		app,
		&window,
		"click",
		serde_json::json!({
			"elementId": element_id,
		}),
	)
	.await
	{
		warn!(
			label = window.label(),
			element_id, error, "agent-browser click failed, returning fallback snapshot"
		);
	}
	let _ = stabilize(app, &window).await;
	wait_for_snapshot_or_fallback(app, &window, "click").await
}

async fn type_text<R: Runtime>(
	app: &tauri::AppHandle<R>,
	agent_session_id: &str,
	element_id: &str,
	text: &str,
) -> Result<AgentBrowserPageSnapshot, String> {
	let window = ensure_browser_session(app, agent_session_id, None)?;
	ensure_collector(&window)?;
	if let Err(error) = execute_collector_json::<R, bool>(
		app,
		&window,
		"type",
		serde_json::json!({
			"elementId": element_id,
			"text": text,
		}),
	)
	.await
	{
		warn!(
			label = window.label(),
			element_id, text, error, "agent-browser type failed, returning fallback snapshot"
		);
	}
	let _ = stabilize(app, &window).await;
	wait_for_snapshot_or_fallback(app, &window, "type").await
}

async fn scroll_page<R: Runtime>(app: &tauri::AppHandle<R>, agent_session_id: &str) -> Result<AgentBrowserPageSnapshot, String> {
	let window = ensure_browser_session(app, agent_session_id, None)?;
	ensure_collector(&window)?;
	if let Err(error) = execute_collector_json::<R, bool>(app, &window, "scroll", serde_json::json!({})).await {
		warn!(label = window.label(), error, "agent-browser scroll failed, returning fallback snapshot");
	}
	let _ = stabilize(app, &window).await;
	wait_for_snapshot_or_fallback(app, &window, "scroll").await
}

async fn read_snapshot<R: Runtime>(app: &tauri::AppHandle<R>, window: &WebviewWindow<R>) -> Result<AgentBrowserPageSnapshot, String> {
	info!(label = window.label(), "agent-browser read snapshot");
	execute_collector_json(app, window, "read_page", serde_json::json!({})).await
}

async fn read_snapshot_or_fallback<R: Runtime>(
	app: &tauri::AppHandle<R>,
	window: &WebviewWindow<R>,
	reason: &str,
) -> Result<AgentBrowserPageSnapshot, String> {
	match read_snapshot(app, window).await {
		Ok(snapshot) => Ok(snapshot),
		Err(error) => {
			warn!(
				label = window.label(),
				reason, error, "agent-browser snapshot failed, returning fallback snapshot"
			);
			Ok(build_fallback_snapshot(app, window, &snapshot_failure_reason(reason, &error)).await)
		}
	}
}

async fn wait_for_snapshot_or_fallback<R: Runtime>(
	app: &tauri::AppHandle<R>,
	window: &WebviewWindow<R>,
	reason: &str,
) -> Result<AgentBrowserPageSnapshot, String> {
	let mut last_error: Option<String> = None;

	for attempt in 0..SNAPSHOT_ATTEMPTS {
		let _ = wait_until_document_ready(app, window).await;
		ensure_collector(window)?;

		match read_snapshot(app, window).await {
			Ok(snapshot) if !snapshot.accessibility_tree.trim().is_empty() && snapshot.accessibility_tree != EMPTY_ACCESSIBILITY_TREE => {
				return Ok(snapshot);
			}
			Ok(snapshot) if attempt + 1 == SNAPSHOT_ATTEMPTS => {
				warn!(
					label = window.label(),
					reason, attempt, "agent-browser snapshot remained empty, returning last snapshot"
				);
				return Ok(snapshot);
			}
			Ok(_) => {
				tokio::time::sleep(Duration::from_millis(SNAPSHOT_RETRY_DELAY_MS)).await;
			}
			Err(error) if attempt + 1 < SNAPSHOT_ATTEMPTS => {
				last_error = Some(error.clone());
				warn!(
					label = window.label(),
					reason, attempt, error, "agent-browser snapshot attempt failed, retrying"
				);
				tokio::time::sleep(Duration::from_millis(SNAPSHOT_RETRY_DELAY_MS)).await;
			}
			Err(error) => {
				last_error = Some(error);
				break;
			}
		}
	}

	if let Some(error) = last_error {
		return Ok(build_fallback_snapshot(app, window, &snapshot_failure_reason(reason, &error)).await);
	}

	read_snapshot_or_fallback(app, window, reason).await
}

fn ensure_collector<R: Runtime>(window: &WebviewWindow<R>) -> Result<(), String> {
	info!(label = window.label(), "agent-browser inject collector");
	window
		.eval(include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/scripts/collector.js")))
		.map_err(|error| error.to_string())
}

fn is_missing_collector_error(error: &str) -> bool {
	error.contains("__gxAgentBrowser") || error.contains("handleRequest") || error.contains("Unknown agent browser action")
}

async fn execute_collector_json<R: Runtime, T: DeserializeOwned>(
	app: &tauri::AppHandle<R>,
	window: &WebviewWindow<R>,
	action: &str,
	payload: serde_json::Value,
) -> Result<T, String> {
	let request = AgentBrowserRequest { action, payload };
	for attempt in 0..COLLECTOR_RETRY_ATTEMPTS {
		match execute_json(app, window, &request).await {
			Ok(result) => return Ok(result),
			Err(error) if attempt + 1 < COLLECTOR_RETRY_ATTEMPTS && is_missing_collector_error(&error) => {
				warn!(
					label = window.label(),
					attempt, action, error, "agent-browser collector missing, reinjecting and retrying"
				);
				ensure_collector(window)?;
				tokio::time::sleep(Duration::from_millis(READINESS_DELAY_MS)).await;
			}
			Err(error) => return Err(error),
		}
	}

	Err("agent browser collector retry exhausted".to_string())
}

async fn wait_until_document_ready<R: Runtime>(app: &tauri::AppHandle<R>, window: &WebviewWindow<R>) -> Result<(), String> {
	for _ in 0..READINESS_ATTEMPTS {
		let ready = execute_expression_json::<R, bool>(app, window, "document.readyState === 'complete' || document.readyState === 'interactive'")
			.await
			.map_err(|error| format!("agent browser bridge is unavailable: {error}"))?;
		if ready {
			info!(label = window.label(), "agent-browser document ready");
			return Ok(());
		}
		tokio::time::sleep(Duration::from_millis(READINESS_DELAY_MS)).await;
	}

	warn!(label = window.label(), "agent-browser page did not become ready in time");
	Err("agent browser page did not become ready in time".to_string())
}

async fn stabilize<R: Runtime>(app: &tauri::AppHandle<R>, window: &WebviewWindow<R>) -> Result<(), String> {
	tokio::time::sleep(Duration::from_millis(STABILIZATION_DELAY_MS)).await;
	wait_until_document_ready(app, window).await
}

async fn build_fallback_snapshot<R: Runtime>(app: &tauri::AppHandle<R>, window: &WebviewWindow<R>, reason: &str) -> AgentBrowserPageSnapshot {
	let expression = r#"({
		url: window.location.href,
		title: document?.title || "",
		accessibilityTree: (() => {
			const readyState = document?.readyState || "unknown";
			const bodyText = String(document?.body?.innerText || "")
				.replace(/\s+/g, " ")
				.trim()
				.slice(0, 1200);
			if (bodyText) {
				return `Partial snapshot (${readyState})\n${bodyText}`;
			}
			return `Partial snapshot (${readyState})`;
		})(),
		isBottomReached: false
	})"#;

	match execute_expression_json::<R, AgentBrowserPageSnapshot>(app, window, expression).await {
		Ok(snapshot) => snapshot,
		Err(error) => {
			warn!(label = window.label(), reason, error, "agent-browser fallback snapshot expression failed");
			AgentBrowserPageSnapshot {
				url: String::new(),
				title: String::new(),
				accessibility_tree: format!("Partial snapshot unavailable ({reason})"),
				is_bottom_reached: false,
			}
		}
	}
}

fn find_gramax_host_window<R: Runtime>(app: &tauri::AppHandle<R>, browser_label: &str) -> Option<WebviewWindow<R>> {
	if let Some(window) = app.get_focused_webview() {
		let label = window.label().to_string();
		if label != browser_label && label.starts_with("gramax-window-") {
			return Some(window);
		}
	}

	app
		.webview_windows()
		.iter()
		.find(|(label, _)| label.as_str() != browser_label && label.starts_with("gramax-window-"))
		.map(|(_, window)| window.clone())
}

fn apply_revealed_bounds<R: Runtime>(app: &tauri::AppHandle<R>, window: &WebviewWindow<R>) -> Result<(), String> {
	let Some(host_window) = find_gramax_host_window(app, window.label()) else {
		return Ok(());
	};

	let position = host_window.outer_position().map_err(|error| error.to_string())?;
	let size = host_window.outer_size().map_err(|error| error.to_string())?;
	let width = size.width.saturating_sub((WINDOW_INSET_PX * 2) as u32);
	let height = size.height.saturating_sub((WINDOW_INSET_PX * 2) as u32);

	window
		.set_position(PhysicalPosition::new(position.x + WINDOW_INSET_PX, position.y + WINDOW_INSET_PX))
		.map_err(|error| error.to_string())?;
	window
		.set_size(Size::Physical(PhysicalSize::new(width, height)))
		.map_err(|error| error.to_string())?;

	Ok(())
}

async fn execute_expression_json<R: Runtime, T: DeserializeOwned>(
	app: &tauri::AppHandle<R>,
	window: &WebviewWindow<R>,
	expression: &str,
) -> Result<T, String> {
	let request_id = format!("agent-browser-result-{}", nanoid::nanoid!());
	let (sender, receiver) = oneshot::channel::<String>();
	get_state(app).insert_pending_request(request_id.clone(), sender);
	info!(
		label = window.label(),
		request_id, expression, "agent-browser execute_expression_json start"
	);

	let script = format!(
		"window.__gxBrowserAgent.executeExpression({request_id}, {expression})",
		request_id = serde_json::to_string(&request_id).map_err(|error| error.to_string())?,
		expression = expression,
	);

	window.eval(&script).map_err(|error| error.to_string())?;
	let payload = timeout(COMMAND_TIMEOUT, receiver)
		.await
		.map_err(|_| {
			get_state(app).remove_pending_request(&request_id);
			warn!(label = window.label(), request_id, "agent-browser expression timed out");
			"agent browser expression timed out".to_string()
		})?
		.map_err(|error| error.to_string())?;

	let envelope: BrowserCommandEnvelope<T> = serde_json::from_str(&payload).map_err(|error| error.to_string())?;
	info!(
		label = window.label(),
		request_id,
		ok = envelope.ok,
		"agent-browser execute_expression_json done"
	);
	if envelope.ok {
		envelope.result.ok_or_else(|| "agent browser returned empty result".to_string())
	} else {
		Err(envelope.error.unwrap_or_else(|| "agent browser command failed".to_string()))
	}
}

async fn execute_json<R: Runtime, T: DeserializeOwned>(
	app: &tauri::AppHandle<R>,
	window: &WebviewWindow<R>,
	request: &AgentBrowserRequest<'_>,
) -> Result<T, String> {
	let request_id = format!("agent-browser-result-{}", nanoid::nanoid!());
	let (sender, receiver) = oneshot::channel::<String>();
	get_state(app).insert_pending_request(request_id.clone(), sender);
	let request_json = serde_json::to_string(request).map_err(|error| error.to_string())?;
	info!(
		label = window.label(),
		request_id,
		action = request.action,
		"agent-browser execute_json start"
	);

	let script = format!(
		"window.__gxBrowserAgent.executeAction({request_id}, {request_json})",
		request_id = serde_json::to_string(&request_id).map_err(|error| error.to_string())?,
		request_json = request_json,
	);

	window.eval(&script).map_err(|error| error.to_string())?;
	let payload = timeout(COMMAND_TIMEOUT, receiver)
		.await
		.map_err(|_| {
			get_state(app).remove_pending_request(&request_id);
			warn!(label = window.label(), request_id, "agent-browser command timed out");
			"agent browser command timed out".to_string()
		})?
		.map_err(|error| error.to_string())?;

	let envelope: BrowserCommandEnvelope<T> = serde_json::from_str(&payload).map_err(|error| error.to_string())?;
	info!(label = window.label(), request_id, ok = envelope.ok, "agent-browser execute_json done");
	if envelope.ok {
		envelope.result.ok_or_else(|| "agent browser returned empty result".to_string())
	} else {
		Err(envelope.error.unwrap_or_else(|| "agent browser command failed".to_string()))
	}
}

pub fn init<R: Runtime>() -> tauri::plugin::TauriPlugin<R> {
	use commands::*;

	tauri::plugin::Builder::new("plugin-browser-session")
		.setup(|app, _api| {
			app.manage(BrowserSessionState::default());
			Ok(())
		})
		.on_event(|app, event| {
			if let RunEvent::WindowEvent { label, event, .. } = event {
				handle_window_event(app, label, event);
			}
		})
		.invoke_handler(tauri::generate_handler![
			get_session_meta,
			resolve_request,
			debug_log,
			ensure_session,
			navigate,
			read_page,
			read_element,
			click,
			type_command,
			scroll,
			reveal,
			teardown,
		])
		.build()
}
