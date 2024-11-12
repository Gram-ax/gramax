mod event;

use std::panic::PanicInfo;

use app::BugsnagApp;
use device::BugsnagDevice;
use serde::Deserialize;
use serde::Serialize;

use event::*;

const BUGSNAG_API_ENDPOINT: &str = "https://notify.bugsnag.com/";

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BugsnagNotification {
  pub(crate) api_key: String,
  pub(crate) payload_version: String,
  pub(crate) events: Vec<BugsnagEvent>,
  notifier: BugsnagNotifier,
}

#[derive(Clone)]
pub struct BugsnagNotificationBuilder {
  pub(crate) api_key: String,
  pub(crate) webview_version: String,
  pub(crate) device_id: String,
  pub(crate) notifier: Option<BugsnagNotifier>,
}

impl BugsnagNotificationBuilder {
  pub fn new(api_key: String, webview_version: String) -> Self {
    Self {
      api_key,
      webview_version,
      device_id: machine_uid::get().unwrap_or("unknown".to_string()),
      notifier: None,
    }
  }

  pub fn with_notifier(self, _notifier: BugsnagNotifier) -> Self {
    unimplemented!()
  }

  pub fn custom(
    &self,
    context: String,
    where_occured: String,
    message: Option<String>,
  ) -> BugsnagNotification {
    let exception = BugsnagException::new(where_occured);
    let exception = if let Some(message) = message { exception.with_message(message) } else { exception };

    let event = BugsnagEvent {
      app: BugsnagApp::collect(),
      device: BugsnagDevice::collect(self.device_id.clone(), self.webview_version.clone()),
      context,
      grouping_hash: format!("rust-custom-error-{}", exception.uid()),
      exceptions: vec![exception],
      severity: "Error".to_string(),
      unhandled: true,
    };

    BugsnagNotification {
      api_key: self.api_key.clone(),
      payload_version: "5".to_string(),
      notifier: self.notifier.clone().unwrap_or_default(),
      events: vec![event],
    }
  }

  pub fn from_panic(&self, info: &PanicInfo) -> BugsnagNotification {
    let exception = BugsnagException::from(info);

    let context = info.location().map(|l| l.to_string()).unwrap_or("unknown".to_string());

    let event = BugsnagEvent {
      app: BugsnagApp::collect(),
      device: BugsnagDevice::collect(self.device_id.clone(), self.webview_version.clone()),
      context,
      grouping_hash: format!("rust-panic-{}", exception.uid()),
      exceptions: vec![exception],
      severity: "Error".to_string(),
      unhandled: true,
    };

    BugsnagNotification {
      api_key: self.api_key.clone(),
      payload_version: "5".to_string(),
      notifier: self.notifier.clone().unwrap_or_default(),
      events: vec![event],
    }
  }
}

impl BugsnagNotification {
  pub fn blocking_send(self) -> bool {
    let client = reqwest::blocking::Client::new();

    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert("Bugsnag-Api-Key", self.api_key.parse().unwrap());
    headers.insert("Bugsnag-Payload-Version", "5".parse().unwrap());

    log::info!("bugsnag data: {:#?}", &self);

    match client.post(BUGSNAG_API_ENDPOINT).headers(headers).json(&self).send() {
      Ok(res) => {
        log::info!("sent notification to bugsnag; status: {}", res.status());
        true
      }
      Err(err) => {
        log::error!("error while sending error to bugsnag; error: {:#?}", err);
        false
      }
    }
  }
}
