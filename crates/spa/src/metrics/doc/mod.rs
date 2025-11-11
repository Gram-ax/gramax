mod user;

use std::net::IpAddr;

use serde::Deserialize;
use serde::Serialize;

pub use user::*;

pub const UNIQ_ID_COOKIE_NAME: &str = "gx-uniq-id";

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "kebab-case")]
pub struct MetricDoc {
  pub user_id: UserId,
  pub app_version: Option<String>,
  pub action: UserAction,
  pub ip: Option<IpAddr>,
  pub metadata: Option<UserMetadata>,
  pub raw_user_agent: Option<String>,
  #[serde(with = "time::serde::rfc3339")]
  pub timestamp: time::OffsetDateTime,
}

pub struct MetricDocBuilder {
  inner: MetricDoc,
}

impl MetricDocBuilder {
  pub fn user(id: UserId) -> Self {
    Self {
      inner: MetricDoc {
        user_id: id,
        app_version: None,
        action: UserAction::Unknown,
        ip: None,
        metadata: None,
        raw_user_agent: None,
        timestamp: time::OffsetDateTime::now_utc(),
      },
    }
  }

  pub fn with_app_version(mut self, version: Option<String>) -> Self {
    let Some(version) = version else {
      return self;
    };

    self.inner.app_version = Some(version);
    self
  }

  pub fn with_action(mut self, action: UserAction) -> Self {
    self.inner.action = action;
    self
  }

  pub fn with_ip(mut self, ip: IpAddr) -> Self {
    self.inner.ip = Some(ip);
    self
  }

  pub fn with_parse_user_agent(mut self, user_agent: Option<String>) -> Self {
    let Some(user_agent) = user_agent else {
      return self;
    };

    let parser = woothee::parser::Parser::new();
    let parsed_user_agent = parser.parse(&user_agent);

    if let Some(user_agent) = parsed_user_agent {
      self.inner.metadata = Some(UserMetadata {
        os: Some(user_agent.os.to_string()),
        os_version: Some(user_agent.os_version.to_string()),
        browser: Some(user_agent.name.to_string()),
        browser_version: Some(user_agent.version.to_string()),
        device: Some(user_agent.category.to_string()),
        platform: self.inner.metadata.and_then(|m| m.platform),
      });
    }

    self.inner.raw_user_agent = Some(user_agent);

    self
  }

  pub fn with_user_agent(mut self, user_agent: Option<String>) -> Self {
    self.inner.raw_user_agent = user_agent;
    self
  }

  pub fn with_metadata(mut self, metadata: UserMetadata) -> Self {
    self.inner.metadata = Some(metadata);
    self
  }

  pub fn build(self) -> MetricDoc {
    self.inner
  }
}
