#![allow(clippy::missing_safety_doc)]
#![cfg(target_family = "wasm")]

mod fs;
mod git;
mod macros;

use std::alloc::Layout;
use std::ffi::*;

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

  pub unsafe fn boxed(self) -> *const c_void {
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
    if value.len() == 0 {
      return Self::null();
    }
    Self { len: value.len(), ptr: value.leak().as_ptr(), err: false }
  }
}

extern "C" {
  fn wasmfs_create_opfs_backend() -> *const c_void;
  fn wasmfs_create_directory(mnt: *const c_char, mode: u16, backend: *const c_void) -> i32;
  fn emscripten_run_script(script: *const c_char);
}

pub fn run_js_script<T: AsRef<str>>(script: T) {
  let script = CString::new(script.as_ref()).unwrap().into_raw();
  unsafe { emscripten_run_script(script) }
}

#[no_mangle]
pub unsafe extern "C" fn main() -> i32 {
  _ = simple_logger::init_with_level(log::Level::Info);
  let mountpoint = CString::new("/mnt").unwrap().into_raw();
  let backend = wasmfs_create_opfs_backend();
  info!("opfs backend created");
  assert!(!backend.is_null());
  let create_status = wasmfs_create_directory(mountpoint, 0o777, backend);
  info!("opfs was mounted on /mnt");
  assert_eq!(create_status, 0);
  0
}

#[no_mangle]
pub unsafe extern "C" fn ralloc(len: usize) -> *mut u8 {
  std::alloc::alloc(Layout::from_size_align_unchecked(len, 4))
}

#[no_mangle]
pub unsafe extern "C" fn rfree(ptr: *mut c_void, len: usize) {
  std::alloc::dealloc(ptr.cast(), Layout::from_size_align_unchecked(len, 4));
}
