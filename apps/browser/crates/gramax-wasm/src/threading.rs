use std::ffi::CString;
use std::sync::atomic::AtomicUsize;
use std::sync::atomic::Ordering;
use std::sync::LazyLock;

use threadpool::ThreadPool;

use crate::Buffer;

static THREAD_POOL: LazyLock<ThreadPool> =
  LazyLock::new(|| threadpool::Builder::new().num_threads(7).build());

static ATOMIC_CALLBACK_ID_COUNTER: AtomicUsize = AtomicUsize::new(0);

pub type JobCallbackId = usize;

pub fn run<F: FnOnce() -> Buffer + Send + Sync + 'static>(job: F) -> JobCallbackId {
  let callback_id = ATOMIC_CALLBACK_ID_COUNTER.fetch_add(1, Ordering::SeqCst);

  THREAD_POOL.execute(move || {
    let buffer = job();
    on_done(callback_id, buffer)
  });

  callback_id
}

fn on_done(callback_id: usize, buffer: Buffer) {
  unsafe {
    let ptr = buffer.boxed();
    let script = format!(
      "self.postMessage({{ callbackId: {callback_id}, ptr: {ptr} }})",
      callback_id = callback_id,
      ptr = ptr as usize
    );

    let script_cstr = CString::new(script).unwrap().into_raw() as *const u8;
    crate::ffi::emscripten_run_script(script_cstr);
  }
}
