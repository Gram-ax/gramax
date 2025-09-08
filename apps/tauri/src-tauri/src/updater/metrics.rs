use std::io::Read;
use std::ops::Deref;

use tauri::http::HeaderMap;
use tauri::http::HeaderValue;
use tauri::*;

const METRIC_FILE_NAME: &str = ".metric-id";

pub trait SettingsExt {
  fn get_metric_id(&self) -> Result<Option<MetricId>>;
}

#[derive(Clone, Debug)]
pub struct MetricId(pub String);

pub struct Metric {
  id: String,
  app_version: String,
  os: String,
  os_version: String,
  platform: String,
  device: String,
}

impl Metric {
  pub fn new<R: Runtime>(app: AppHandle<R>, id: String) -> Self {
    let info = os_info::get();

    let os = match (info.os_type(), info.version()) {
      (os_info::Type::Windows, os_info::Version::Custom(ver) | os_info::Version::Rolling(Some(ver))) => {
        format!("Windows {ver}")
      }
      (os_info::Type::Macos, _) => "Mac OSX".to_string(),
      (os, _) => os.to_string(),
    };

    let mut os_version = info.version().to_string();

    if let Some(codename) = info.codename() {
      os_version.push(' ');
      os_version.push_str(codename);
    }

    if let Some(edition) = info.edition() {
      os_version.push(' ');
      os_version.push_str(edition);
    }

    Self {
      id,
      app_version: app.package_info().version.to_string(),
      os,
      os_version,
      platform: info.architecture().unwrap_or("unknown").to_string(),
      device: if cfg!(desktop) { "pc" } else { "mobile" }.to_string(),
    }
  }

  pub fn as_headers(&self) -> HeaderMap {
    let mut headers = HeaderMap::new();

    let unknown = HeaderValue::from_static("unknown");

    headers.insert("x-gx-uniq-id", self.id.parse().unwrap_or(unknown.clone()));
    headers.insert("x-gx-app-version", self.app_version.parse().unwrap_or(unknown.clone()));
    headers.insert("x-gx-os", self.os.parse().unwrap_or(unknown.clone()));
    headers.insert("x-gx-os-version", self.os_version.parse().unwrap_or(unknown.clone()));
    headers.insert("x-gx-platform", self.platform.parse().unwrap_or(unknown.clone()));
    headers.insert("x-gx-device", self.device.parse().unwrap_or(unknown.clone()));

    headers
  }
}

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
