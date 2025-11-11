use std::error::Error;

use serde::ser::SerializeMap;
use tauri_plugin_updater::Error as E;
use url::Url;

#[derive(strum::IntoStaticStr, thiserror::Error, Debug)]
#[strum(serialize_all = "kebab_case")]
pub enum UpdaterError {
  #[error("failed to check enterprise version: {0}")]
  CheckEnterpriseVersion(Box<UpdaterError>),

  #[error("io: {0}")]
  Io(#[from] std::io::Error),

  #[error("server did not respond with any valid release json or 204 status code")]
  NotFound,

  #[error("update check failed (status {status}): {message}")]
  CheckFailed { status: u16, message: String },

  #[error("download failed (status {status}): {url}")]
  DownloadFailed { status: u16, url: Url },

  #[error("install failed: {0}")]
  InstallFailed(E),

  #[error("failed to verify signature: {0}")]
  SignatureMismatch(String),

  #[error("semver: {0}")]
  Semver(#[from] semver::Error),

  #[error("serde: {0}")]
  Json(#[from] serde_json::Error),

  #[error("url: {0}")]
  Url(#[from] url::ParseError),

  #[error(transparent)]
  Reqwest(#[from] reqwest::Error),

  #[error("updater error: {0}")]
  Updater(E),

  #[error(transparent)]
  Tauri(#[from] tauri::Error),

  #[error(transparent)]
  InvalidHeader(#[from] reqwest::header::InvalidHeaderValue),
}

impl serde::Serialize for UpdaterError {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::Serializer,
  {
    let mut map = serializer.serialize_map(Some(3))?;
    map.serialize_key("code")?;
    map.serialize_value(Into::<&'static str>::into(self))?;

    match self {
      UpdaterError::CheckEnterpriseVersion(e) => {
        map.serialize_key("inner")?;
        map.serialize_value(e)?;
      }
      _ => {
        map.serialize_key("message")?;
        map.serialize_value(&self.to_string())?;
      }
    }

    map.serialize_key("src")?;

    let mut final_source = self.source();

    while let Some(source) = final_source {
      if let Some(e) = source.source() {
        final_source = Some(e);
      } else {
        break;
      }
    }

    map.serialize_value(&final_source.map(|e| e.to_string()))?;
    map.end()
  }
}

impl From<E> for UpdaterError {
  fn from(e: E) -> Self {
    match e {
      E::Io(error) => UpdaterError::Io(error),
      E::Reqwest(err) => UpdaterError::Reqwest(err),
      E::Semver(err) => UpdaterError::Semver(err),
      E::Serialization(err) => UpdaterError::Json(err),
      E::ReleaseNotFound => UpdaterError::NotFound,
      E::ServerError { status, body } => UpdaterError::CheckFailed { status, message: body },
      E::Network { status, url } => UpdaterError::DownloadFailed { status, url },
      E::Minisign(err) => UpdaterError::SignatureMismatch(err.to_string()),
      E::SignatureUtf8(err) => UpdaterError::SignatureMismatch(err),

      E::Tauri(err) => UpdaterError::Tauri(err),
      E::TempDirNotOnSameMountPoint
      | E::BinaryNotFoundInArchive
      | E::TempDirNotFound
      | E::DebInstallFailed
      | E::PackageInstallFailed
      | E::InvalidUpdaterFormat => UpdaterError::InstallFailed(e),

      e => UpdaterError::Updater(e),
    }
  }
}
