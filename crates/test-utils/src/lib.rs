pub use std::fs;
pub use std::path::Path;
pub use std::path::PathBuf;
use std::sync::Once;

use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

pub use rstest::fixture;
pub use rstest::rstest;
pub use tempfile::TempDir;

pub use tracing::*;

#[cfg(feature = "git")]
pub mod git;

fn init_logger() {
	let show_output = std::env::args().any(|arg| arg == "--exact");
	if !show_output {
		return;
	}

	tracing_subscriber::registry()
		.with(EnvFilter::try_from_default_env().unwrap_or(EnvFilter::new("info")))
		.with(tracing_subscriber::fmt::layer().with_ansi(true))
		.init();
}

#[fixture]
pub fn sandbox() -> TempDir {
	static INIT: Once = Once::new();
	INIT.call_once(init_logger);

	let path = Path::new(&std::env::temp_dir()).join("testing");
	std::fs::create_dir_all(&path).unwrap();
	tempfile::Builder::new().prefix("tmp").tempdir_in(path).unwrap()
}
