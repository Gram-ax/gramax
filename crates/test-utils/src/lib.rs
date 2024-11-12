pub use std::fs;
use std::io::Write;
pub use std::path::Path;
pub use std::path::PathBuf;
use std::sync::Once;

use env_logger::fmt::Color;

pub use rstest::fixture;
pub use rstest::rstest;
pub use tempdir::TempDir;

#[cfg(feature = "git")]
pub mod git;

fn init_logger() {
  env_logger::Builder::new()
    .is_test(!std::env::args().any(|arg| arg == "--show-output"))
    .format(|f, record| {
      let mut level_style = f.style();
      match record.level() {
        log::Level::Error => level_style.set_bold(true).set_color(Color::Red),
        log::Level::Warn => level_style.set_bold(true).set_color(Color::Yellow),
        log::Level::Info => level_style.set_color(Color::Green),
        log::Level::Debug => level_style.set_dimmed(true).set_color(Color::Blue),
        log::Level::Trace => level_style.set_dimmed(true).set_color(Color::Cyan),
      };

      let mut target_style = f.style();
      target_style.set_bold(true);

      let mut sep_style = f.style();
      sep_style.set_dimmed(true);

      write!(f, "{level:<6} ", level = level_style.value(record.level()))?;
      write!(f, "{target}", target = target_style.value(record.target()))?;
      write!(f, " {sep} ", sep = sep_style.value("#"))?;
      writeln!(f, "{body}", body = record.args())
    })
    .filter_level(log::LevelFilter::Info)
    .write_style(env_logger::WriteStyle::Always)
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
