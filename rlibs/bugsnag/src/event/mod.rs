pub mod app;
pub mod device;

use std::hash::DefaultHasher;
use std::hash::Hash;
use std::hash::Hasher;
use std::panic::PanicInfo;

use serde::Deserialize;
use serde::Serialize;

use app::BugsnagApp;
use device::BugsnagDevice;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BugsnagNotifier {
  pub(crate) name: String,
  pub(crate) version: String,
  pub(crate) url: String,
  pub(crate) dependencies: Vec<()>,
}

impl Default for BugsnagNotifier {
  fn default() -> Self {
    Self {
      name: "gramax-bugsnag-rs".to_string(),
      version: env!("CARGO_PKG_VERSION").to_string(),
      url: "https://gram.ax".to_string(),
      dependencies: Default::default(),
    }
  }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BugsnagEvent {
  pub(crate) exceptions: Vec<BugsnagException>,
  pub(crate) grouping_hash: String,
  pub(crate) context: String,
  pub(crate) unhandled: bool,
  pub(crate) severity: String,
  pub(crate) app: BugsnagApp,
  pub(crate) device: BugsnagDevice,
}

#[derive(Serialize, Deserialize, Hash, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BugsnagException {
  pub(crate) error_class: String,
  pub(crate) message: Option<String>,
  pub(crate) stacktrace: Vec<Frame>,
}

#[derive(Serialize, Deserialize, Hash, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Frame {
  pub(crate) file: String,
  pub(crate) line_number: u32,
  pub(crate) column_number: u32,
  pub(crate) method: String,
  pub(crate) in_project: bool,
}

impl BugsnagException {
  pub fn new(where_occured: String) -> Self {
    Self { error_class: where_occured, message: None, stacktrace: collect_stacktrace() }
  }

  pub fn with_message(mut self, message: String) -> Self {
    self.message.replace(message);
    self
  }

  pub fn uid(&self) -> u64 {
    let mut hash = DefaultHasher::new();
    self.hash(&mut hash);
    hash.finish()
  }
}

impl From<&PanicInfo<'_>> for BugsnagException {
  fn from(panic_info: &PanicInfo) -> Self {
    let payload = panic_info.payload();
    let exception = BugsnagException::new("Thread panicked".to_string());

    if let Some(payload) = payload.downcast_ref::<String>() {
      exception.with_message(payload.to_owned())
    } else if let Some(payload) = payload.downcast_ref::<&'_ str>() {
      exception.with_message(payload.to_string())
    } else {
      exception
    }
  }
}

impl From<&backtrace::Symbol> for Frame {
  fn from(trace: &backtrace::Symbol) -> Self {
    let search_in = env!("CARGO_WORKSPACE_DIR");
    let exclude_self = env!("CARGO_MANIFEST_DIR");

    let file = trace.filename().and_then(|p| p.to_str()).unwrap_or("unknown file").to_string();
    let line_number = trace.lineno().unwrap_or(0);
    let column_number = trace.colno().unwrap_or(0);
    let method = trace.name().map(|name| name.to_string()).unwrap_or_else(|| "unknown".to_string());
    let in_project = file.starts_with(search_in) && !file.starts_with(exclude_self);

    Frame { file, method, line_number, column_number, in_project }
  }
}

fn collect_stacktrace() -> Vec<Frame> {
  let mut frames = vec![];

  backtrace::trace(|frame| {
    backtrace::resolve(frame.ip(), |symbol| frames.push(Frame::from(symbol)));
    true
  });

  frames
}
