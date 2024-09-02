use serde::Deserialize;
use serde::Serialize;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BugsnagApp {
  pub(crate) id: String,
  pub(crate) version: String,
  pub(crate) binary_arch: String,
  pub(crate) running_on_rosetta: bool,
}

impl BugsnagApp {
  pub fn collect() -> Self {
    let info = os_info::get();
    let arch = info.architecture().unwrap_or("unknown arch");

    Self {
      id: "gramax".to_string(),
      version: env!("CARGO_PKG_VERSION").to_string(),
      binary_arch: std::env::consts::ARCH.to_string(),
      running_on_rosetta: arch == "arm64" && std::env::consts::ARCH == "x86_64",
    }
  }
}
