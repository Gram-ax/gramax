use tauri::*;

use std::collections::HashMap;
use std::io::Read;
use std::ops::Deref;
use std::path::Path;
use std::sync::Mutex;
use std::time::Duration;
use std::time::SystemTime;

use serde::Deserialize;
use serde::Serialize;

const SETTINGS_FILE_NAME: &str = "settings.json";
const METRIC_FILE_NAME: &str = ".metric-id";

const TAG: &str = "app:settings";

pub trait SettingsExt {
  fn get_metric_id(&self) -> Result<Option<MetricId>>;
}

#[derive(Clone, Debug)]
pub struct MetricId(pub String);

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(transparent)]
pub struct Settings(HashMap<String, String>);

struct SettingsStateInner {
  last_time_changed: u64,
  data: Settings,
}

type SettingsState = Mutex<SettingsStateInner>;

impl Deref for MetricId {
  type Target = String;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl<R: Runtime> SettingsExt for AppHandle<R> {
  fn get_metric_id(&self) -> Result<Option<MetricId>> {
    if let Some(id) = self.try_state::<MetricId>() {
      return Ok(Some(id.inner().clone()));
    }

    let path = self.path().app_data_dir()?.join(METRIC_FILE_NAME);
    if !path.exists() {
      let id = nanoid::nanoid!(16);
      std::fs::write(path, &id)?;
      let id = MetricId(id);
      self.manage::<MetricId>(id.clone());
      return Ok(Some(id));
    }

    let mut file = std::fs::File::open(path)?;
    let mut buf = [0; 16];
    file.read_exact(&mut buf)?;

    let Ok(id) = String::from_utf8(buf.to_vec()) else {
      return Ok(None);
    };

    if id.len() != 16 {
      return Ok(None);
    }

    self.manage::<MetricId>(MetricId(id.clone()));
    Ok(Some(MetricId(id)))
  }
}

#[command]
pub fn get_settings<R: Runtime>(manager: AppHandle<R>) -> Result<Settings> {
  let path = manager.path().app_data_dir()?.join(SETTINGS_FILE_NAME);

  match manager.try_state::<SettingsState>() {
    Some(state) => get_actual_settings(&manager, &state, &path)?,
    None => init_settings_state(&manager, &path)?,
  }

  let state = manager.state::<SettingsState>().lock().unwrap().data.clone();
  Ok(state)
}

#[command]
pub fn set_settings<R: Runtime>(manager: AppHandle<R>, data: HashMap<String, String>) -> Result<()> {
  let path = manager.path().app_data_dir()?.join(SETTINGS_FILE_NAME);

  std::fs::write(path, serde_json::to_string(&data)?)?;
  let state = manager.state::<SettingsState>();
  let mut state = state.lock().unwrap();
  state.last_time_changed = time_now();
  state.data = Settings(data);

  manager.emit("settings-data-updated", &state.data)?;
  Ok(())
}

fn get_actual_settings<R: Runtime>(app: &AppHandle<R>, state: &SettingsState, path: &Path) -> Result<()> {
  if !path.exists() {
    return Ok(());
  }

  let modified = path.metadata()?.modified()?.elapsed().unwrap_or(Duration::from_secs(0)).as_secs();
  let mut state = state.lock().unwrap();
  if state.last_time_changed < modified {
    state.last_time_changed = modified;
    let content = std::fs::read_to_string(path)?;
    match serde_json::from_str::<HashMap<String, String>>(&content) {
      Ok(data) => {
        state.data = Settings(data);
        app.emit("settings-data-updated", &state.data)?;
      }
      Err(e) => {
        error!(target: TAG, "failed to parse settings file at {}; state wasn't updated; err: {:?}", path.display(), e);
      }
    }
  }

  Ok(())
}

fn init_settings_state<R: Runtime, M: Manager<R>>(manager: &M, path: &Path) -> Result<()> {
  if !path.exists() {
    warn!(target: TAG, "settings file {} doesn't exist; state not inited", path.display());
    let state = SettingsStateInner { last_time_changed: time_now(), data: Settings(HashMap::new()) };
    manager.manage::<SettingsState>(Mutex::new(state));
    return Ok(());
  }

  let content = std::fs::read_to_string(path)?;
  let data = match serde_json::from_str::<HashMap<String, String>>(&content) {
    Ok(data) => data,
    Err(err) => {
      error!(target: TAG, "failed to parse settings file at {}; state not inited; err: {:?}", path.display(), err);
      return Ok(());
    }
  };

  let state = SettingsStateInner { last_time_changed: time_now(), data: Settings(data) };

  let is_managed = manager.manage::<SettingsState>(Mutex::new(state));
  if !is_managed {
    error!(target: TAG, "failed to manage settings state; state possibly wasn't updated");
    return Ok(());
  }

  Ok(())
}

fn time_now() -> u64 {
  SystemTime::now().elapsed().unwrap_or(Duration::from_secs(0)).as_secs()
}
