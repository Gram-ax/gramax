use gramaxfs::commands as fs;
use std::path::PathBuf;

use gramaxfs::error::Result;
use gramaxfs::DirStat;
use gramaxfs::FileInfo;

use em_bindgen_macro::em_bindgen;

#[em_bindgen(json)]
pub fn read_dir(path: String) -> Result<Vec<String>> {
  fs::read_dir(path)
}

#[em_bindgen(bytes)]
pub fn read_file(path: String) -> Result<Vec<u8>> {
  fs::read_file(path)
}

#[em_bindgen]
pub fn write_file(path: String, content_ptr: usize, content_len: usize) -> Result<()> {
  let vec = unsafe { Vec::from_raw_parts(content_ptr as *mut u8, content_len, content_len) };
  fs::write_file(path, vec)
}

#[em_bindgen(json)]
pub fn read_link(path: String) -> Result<PathBuf> {
  fs::read_link(path)
}

#[em_bindgen]
pub fn make_dir(path: String, recursive: bool) -> Result<()> {
  fs::make_dir(path, recursive)
}

#[em_bindgen]
pub fn remove_dir(path: String, recursive: bool) -> Result<()> {
  fs::remove_dir(path, recursive)
}

#[em_bindgen]
pub fn make_symlink(from: String, to: String) -> Result<()> {
  fs::make_symlink(from, to)
}

#[em_bindgen(json)]
pub fn getstat(path: String, follow_link: bool) -> Result<FileInfo> {
  fs::getstat(path, follow_link)
}

#[em_bindgen(json)]
pub fn read_dir_stats(path: String) -> Result<Vec<DirStat>> {
  fs::read_dir_stats(path)
}

#[em_bindgen]
pub fn rmfile(path: String) -> Result<()> {
  fs::rmfile(path)
}

#[em_bindgen(json)]
pub fn exists(path: String) -> Result<bool> {
  fs::exists(path)
}

#[em_bindgen]
pub fn copy(from: String, to: String) -> Result<()> {
  fs::copy(from, to)
}

#[em_bindgen]
pub fn mv(from: String, to: String) -> Result<()> {
  fs::mv(from, to)
}
