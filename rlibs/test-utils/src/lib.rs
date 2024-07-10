pub use std::fs;
pub use std::path::Path;
pub use std::path::PathBuf;

pub use rstest::fixture;
pub use rstest::rstest;
pub use tempdir::TempDir;

#[cfg(feature = "git")]
pub mod git;

#[fixture]
pub fn sandbox() -> TempDir {
  let path = Path::new(&std::env::temp_dir()).join("testing");
  std::fs::create_dir_all(&path).unwrap();
  TempDir::new_in(path, "tmp").unwrap()
}
