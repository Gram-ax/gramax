mod artifacts;
pub mod endpoint;
pub mod error;
pub mod extract;

pub use artifacts::package::*;

pub use artifacts::s3::S3BaseUrl;

use reqwest::Url;
use serde::de::Error;
use serde::Deserialize;
use serde::Serialize;

pub use artifacts::*;
pub use endpoint::Updater;
pub use error::*;

#[derive(Clone)]
pub struct AppState {
  pub artifacts: ArtifactStore,
}

#[derive(Serialize, Default, Hash, Eq, PartialEq, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Version {
  #[default]
  Latest,
  Exact(semver::Version),
}

impl std::fmt::Display for Version {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Version::Latest => write!(f, "latest"),
      Version::Exact(version) => write!(f, "{}", version),
    }
  }
}

impl<'de> Deserialize<'de> for Version {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: serde::Deserializer<'de>,
  {
    String::deserialize(deserializer)?.parse().map_err(D::Error::custom)
  }
}

impl std::str::FromStr for Version {
  type Err = semver::Error;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    Ok(match s {
      "latest" => Version::Latest,
      other => {
        let version = semver::Version::parse(other)?;
        Version::Exact(version)
      }
    })
  }
}

#[derive(Serialize, Deserialize, Hash, Eq, PartialEq, Default, Debug, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum Channel {
  #[default]
  Prod,
  Dev,
}

impl AsRef<str> for Channel {
  fn as_ref(&self) -> &str {
    match self {
      Channel::Prod => "prod",
      Channel::Dev => "dev",
    }
  }
}

impl std::fmt::Display for Channel {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{}", self.as_ref())
  }
}

impl Channel {
  pub fn all() -> [Channel; 2] {
    [Channel::Prod, Channel::Dev]
  }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct Update {
  pub version: semver::Version,
  #[serde(with = "time::serde::rfc3339")]
  pub pub_date: time::OffsetDateTime,
  pub url: Url,
  pub signature: String,
  pub notes: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Release {
  #[serde(rename = "version", alias = "current")]
  pub version: semver::Version,
  #[serde(rename = "pub_date")]
  #[serde(with = "time::serde::rfc3339")]
  pub pub_date: time::OffsetDateTime,
  #[serde(alias = "platforms")]
  pub platforms: std::collections::HashMap<Platform, PlatformInfo>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlatformInfo {
  pub signature: String,
  pub url: String,
}
