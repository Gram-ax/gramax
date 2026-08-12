use tauri::*;
use tracing::Span;
use tracing_opentelemetry::OpenTelemetrySpanExt;

use std::collections::HashMap;
use std::path::Path;
use std::sync::Mutex;
use std::time::Duration;
use std::time::SystemTime;

use serde::Deserialize;
use serde::Serialize;

const SETTINGS_FILE_NAME: &str = "settings.json";

const TAG: &str = "app:settings";

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(transparent)]
pub struct Settings(HashMap<String, serde_json::Value>);

impl Settings {
	pub fn get(&self, key: &str) -> Option<&serde_json::Value> {
		self.0.get(key)
	}
}

#[derive(Debug)]
struct SettingsStateInner {
	last_time_changed: u64,
	data: Settings,
}

type SettingsState = Mutex<SettingsStateInner>;

impl Default for SettingsStateInner {
	fn default() -> Self {
		Self {
			last_time_changed: time_now(),
			data: Settings(HashMap::new()),
		}
	}
}

pub fn get_settings_inner<R: Runtime>(manager: &AppHandle<R>) -> Result<Settings> {
	let path = manager.path().app_data_dir()?.join(SETTINGS_FILE_NAME);

	match manager.try_state::<SettingsState>() {
		Some(state) => get_actual_settings(manager, &state, &path)?,
		None => init_settings_state(manager, &path)?,
	}

	let state = manager.state::<SettingsState>().lock().unwrap().data.clone();
	Ok(state)
}

#[command]
pub fn get_settings<R: Runtime>(manager: AppHandle<R>) -> Result<Settings> {
	get_settings_inner(&manager)
}

#[command]
pub fn set_settings<R: Runtime>(manager: AppHandle<R>, data: HashMap<String, serde_json::Value>) -> Result<()> {
	let path = manager.path().app_data_dir()?.join(SETTINGS_FILE_NAME);

	std::fs::write(path, serde_json::to_string(&data)?)?;
	let state = manager.state::<SettingsState>();
	let mut state = state.lock().unwrap();
	state.last_time_changed = time_now();
	state.data = Settings(data);

	manager.emit("settings-data-updated", &state.data)?;
	Ok(())
}

pub fn update_setting<R: Runtime>(manager: &AppHandle<R>, key: &str, value: serde_json::Value) -> Result<()> {
	let path = manager.path().app_data_dir()?.join(SETTINGS_FILE_NAME);

	match manager.try_state::<SettingsState>() {
		Some(state) => get_actual_settings(manager, &state, &path)?,
		None => init_settings_state(manager, &path)?,
	}

	let state = manager.state::<SettingsState>();
	let mut state_guard = state.lock().unwrap();

	state_guard.data.0.insert(key.to_string(), value);
	state_guard.last_time_changed = time_now();

	std::fs::write(&path, serde_json::to_string(&state_guard.data.0)?)?;

	manager.emit("settings-data-updated", &state_guard.data)?;
	Ok(())
}

#[instrument(skip(app, state))]
fn get_actual_settings<R: Runtime>(app: &AppHandle<R>, state: &SettingsState, path: &Path) -> Result<()> {
	if !path.exists() {
		return Ok(());
	}

	let modified = path.metadata()?.modified()?.elapsed().unwrap_or(Duration::from_secs(0)).as_secs();
	let mut state = state.lock().unwrap();
	if state.last_time_changed < modified {
		state.last_time_changed = modified;
		let content = std::fs::read_to_string(path)?;
		match serde_json::from_str::<HashMap<String, serde_json::Value>>(&content) {
			Ok(data) => {
				state.data = Settings(data);
				app.emit("settings-data-updated", &state.data)?;
			}
			Err(e) => {
				error!(target: TAG, "failed to parse settings file at {}; state was not updated", path.display());
				Span::current().set_status(opentelemetry::trace::Status::Error {
					description: e.to_string().into(),
				});
			}
		}
	}

	Ok(())
}

#[instrument(skip(manager))]
fn init_settings_state<R: Runtime, M: Manager<R>>(manager: &M, path: &Path) -> Result<()> {
	if !path.exists() {
		warn!(target: TAG, "settings file {} doesn't exist; state not inited", path.display());
		manager.manage::<SettingsState>(Mutex::default());
		return Ok(());
	}

	let content = std::fs::read_to_string(path)?;
	let data = match serde_json::from_str::<HashMap<String, serde_json::Value>>(&content) {
		Ok(data) => data,
		Err(err) => {
			error!(target: TAG, "failed to parse settings file at {}; state not inited", path.display());
			Span::current().set_status(opentelemetry::trace::Status::Error {
				description: err.to_string().into(),
			});
			manager.manage::<SettingsState>(Mutex::default());
			return Ok(());
		}
	};

	let state = SettingsStateInner {
		data: Settings(data),
		..SettingsStateInner::default()
	};

	let is_managed = manager.manage::<SettingsState>(Mutex::new(state));
	if !is_managed {
		error!(target: TAG, "failed to manage settings state; state possibly was not updated");
		return Ok(());
	}

	Ok(())
}

fn time_now() -> u64 {
	SystemTime::now().elapsed().unwrap_or(Duration::from_secs(0)).as_secs()
}
