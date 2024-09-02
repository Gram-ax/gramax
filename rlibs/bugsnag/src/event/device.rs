use std::collections::HashMap;

use serde::Deserialize;
use serde::Serialize;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BugsnagDevice {
  pub(crate) id: String,
  pub(crate) os_name: String,
  pub(crate) os_version: String,
  pub(crate) browser_version: String,
  pub(crate) time: String,
  pub(crate) cpu_abi: Vec<String>,
  pub(crate) runtime_versions: HashMap<String, String>,
}

impl BugsnagDevice {
  pub fn collect(device_id: String, webview_version: String) -> Self {
    let info = os_info::get();
    let arch = info.architecture().unwrap_or("unknown arch");

    Self {
      id: device_id,
      browser_version: webview_version,
      os_name: info.os_type().to_string(),
      os_version: info.version().to_string(),
      time: chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
      cpu_abi: vec![arch.to_string()],
      runtime_versions: HashMap::new(),
    }
  }
}
