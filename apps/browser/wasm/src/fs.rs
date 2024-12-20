use gramaxfs::commands as fs;
use std::path::PathBuf;

use gramaxfs::error::Result;
use gramaxfs::FileInfo;
use gramaxfs::DirStat;

use crate::define_c_api;

define_c_api! {
  json fn read_dir(path: String) -> Vec<String> {
    fs::read_dir(path)
  }

  bytes fn read_file(path: String) -> Vec<u8> {
    fs::read_file(path)
  }

  noreturn fn write_file(path: String, content_ptr: usize, content_len: usize) -> () {
    let vec = unsafe { Vec::from_raw_parts(content_ptr as *mut u8, content_len, content_len) };
    fs::write_file(path, vec)
  }

  json fn read_link(path: String) -> PathBuf {
    fs::read_link(path)
  }

  noreturn fn make_dir(path: String, recursive: bool) -> () {
    fs::make_dir(path, recursive)
  }

  noreturn fn remove_dir(path: String, recursive: bool) -> () {
    fs::remove_dir(path, recursive)
  }

  noreturn fn make_symlink(from: String, to: String) -> () {
    fs::make_symlink(from, to)
  }

  json fn getstat(path: String, follow_link: bool) -> FileInfo {
    fs::getstat(path, follow_link)
  }

  json fn read_dir_stats(path: String) -> Vec<DirStat> {
    fs::read_dir_stats(path)
  }

  noreturn fn rmfile(path: String) -> () {
    fs::rmfile(path)
  }

  json fn exists(path: String) -> bool {
    fs::exists(path)
  }

  noreturn fn copy(from: String, to: String) -> () {
    fs::copy(from, to)
  }

  noreturn fn mv(from: String, to: String) -> () {
    fs::mv(from, to)
  }
}
