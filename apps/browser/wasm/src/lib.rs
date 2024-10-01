#![allow(clippy::missing_safety_doc)]
#![cfg(target_family = "wasm")]

mod ffi;
mod fs;
mod git;
mod macros;
mod threading;
mod kvstore;

use ffi::*;
use log::info;

#[repr(C)]
struct Buffer {
  len: usize,
  ptr: *const u8,
  err: bool,
}

impl Buffer {
  pub fn null() -> Self {
    Self { len: 0, ptr: std::ptr::null(), err: false }
  }

  pub unsafe fn boxed(self) -> *const std::ffi::c_void {
    Box::into_raw(Box::new(self)).cast()
  }

  fn into_error(self) -> Self {
    Self { err: true, ..self }
  }
}

impl<E: serde::Serialize> From<Result<Vec<u8>, E>> for Buffer {
  fn from(value: Result<Vec<u8>, E>) -> Self {
    match value {
      Ok(value) => Self::from(value),
      Err(err) => Self::from(serde_json::to_vec(&err).expect("unable to serialize err")).into_error(),
    }
  }
}

impl From<Vec<u8>> for Buffer {
  fn from(value: Vec<u8>) -> Self {
    if value.is_empty() {
      return Self::null();
    }
    Self { len: value.len(), ptr: value.leak().as_ptr(), err: false }
  }
}

unsafe fn main() -> i32 {
  _ = simple_logger::init_with_level(log::Level::Info);

  let mountpoint = std::ffi::CString::new("/mnt").unwrap().into_raw();
  let backend = wasmfs_create_opfs_backend();

  assert!(!backend.is_null());
  let create_status = wasmfs_create_directory(mountpoint, 0o777, backend);

  info!("opfs was mounted on /mnt");
  assert_eq!(create_status, 0);
  0
}
