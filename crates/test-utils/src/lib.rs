pub use std::fs;
pub use std::path::Path;
pub use std::path::PathBuf;
use std::sync::Once;

use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

pub use rstest::fixture;
pub use rstest::rstest;
pub use tempdir::TempDir;

#[cfg(feature = "git")]
pub mod git;

fn init_logger() {
  let show_output = std::env::args().any(|arg| arg == "--show-output");
  if !show_output {
    return;
  }

  tracing_subscriber::registry()
    .with(EnvFilter::from_default_env())
    .with(tracing_subscriber::fmt::layer().with_ansi(true))
    .init();
}

#[fixture]
pub fn sandbox() -> TempDir {
  static INIT: Once = Once::new();
  INIT.call_once(init_logger);

  let path = Path::new(&std::env::temp_dir()).join("testing");
  std::fs::create_dir_all(&path).unwrap();
  TempDir::new_in(path, "tmp").unwrap()
}
