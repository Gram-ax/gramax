use std::io::Read;
use std::path::Path;

use tauri::Result;

pub fn is_lfs_pointer(path: &Path) -> Result<bool> {
	if path.metadata()?.is_dir() {
		return Ok(false);
	}

	let mut file = std::fs::File::open(path)?;
	let mut buf = [0; 200];
	file.read(&mut buf)?;
	Ok(gramaxgit::lfs::Pointer::is_pointer(&buf))
}
