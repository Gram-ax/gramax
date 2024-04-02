#![allow(clippy::missing_safety_doc)]

mod fs;
mod git;
mod macros;

use std::alloc::Layout;
use std::ffi::*;

#[repr(C)]
struct Buffer {
  len: usize,
  ptr: *const u8,
}

impl Buffer {
  pub fn null() -> Self {
    Self { len: 0, ptr: std::ptr::null() }
  }

  pub unsafe fn boxed(self) -> *const c_void {
    Box::into_raw(Box::new(self)).cast()
  }
}

impl From<Vec<u8>> for Buffer {
  fn from(value: Vec<u8>) -> Self {
    Self { len: value.len(), ptr: value.leak().as_ptr() }
  }
}

#[cfg(target_family = "wasm")]
extern "C" {
  fn wasmfs_create_opfs_backend() -> *const c_void;
  fn wasmfs_create_directory(mnt: *const c_char, mode: u16, backend: *const c_void) -> i32;
}

#[cfg(target_family = "wasm")]
#[no_mangle]
pub unsafe extern "C" fn main() -> i32 {
  let mountpoint = CString::new("/docs").unwrap().into_raw().cast_const();
  let backend = wasmfs_create_opfs_backend();
  assert!(!backend.is_null());
  let create_status = wasmfs_create_directory(mountpoint, 0o644, backend);
  assert_eq!(create_status, 0);
  0
}

#[no_mangle]
pub extern "C" fn _emscripten_memcpy_js(_: i32, _: i32, _: i32) {
  unreachable!("emscripten_memcpy_js")
}

#[no_mangle]
pub unsafe extern "C" fn ralloc(len: usize) -> *mut c_char {
  std::alloc::alloc(Layout::from_size_align_unchecked(len, 4)) as *mut c_char
}

#[no_mangle]
pub unsafe extern "C" fn rfree(ptr: *mut c_void, len: usize) {
  std::alloc::dealloc(ptr.cast(), Layout::from_size_align_unchecked(len, 4));
}
