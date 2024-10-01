use std::alloc::Layout;
use std::ffi::*;

extern "C" {
  pub fn wasmfs_create_opfs_backend() -> *const c_void;
  pub fn wasmfs_create_directory(mnt: *const c_char, mode: u16, backend: *const c_void) -> i32;
  pub fn emscripten_run_script(script: *const u8);
}

#[no_mangle]
pub unsafe extern "C" fn main() -> i32 {
  super::main()
}

#[no_mangle]
pub unsafe extern "C" fn ralloc(len: usize) -> *mut u8 {
  std::alloc::alloc(Layout::from_size_align_unchecked(len, 4))
}

#[no_mangle]
pub unsafe extern "C" fn rfree(ptr: *mut c_void, len: usize) {
  std::alloc::dealloc(ptr.cast(), Layout::from_size_align_unchecked(len, 4));
}
