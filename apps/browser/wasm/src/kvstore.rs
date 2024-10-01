use std::collections::HashMap;
use std::sync::LazyLock;
use std::sync::Mutex;

use crate::Buffer;

static STORE: LazyLock<Mutex<HashMap<u8, Vec<u8>>>> = LazyLock::new(|| Mutex::new(HashMap::new()));

#[no_mangle]
pub unsafe extern "C" fn store(key: u8, len: usize, ptr: *mut u8) {
  let vec = Vec::from_raw_parts(ptr, len, len);
  STORE.lock().unwrap().insert(key, vec);
}

#[no_mangle]
pub unsafe extern "C" fn get_store(key: u8) -> *const std::ffi::c_void {
  let val = STORE.lock().unwrap().get(&key).cloned();

  match val {
    Some(v) => Buffer::from(v),
    None => Buffer::from(Vec::new()),
  }
  .boxed()
}
