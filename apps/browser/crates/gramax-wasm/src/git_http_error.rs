use std::sync::Mutex;

use tracing::*;

use gramaxgit::commands::Result;
use gramaxgit::error::Error;

use crate::git::TAG;

thread_local! {
  static LAST_HTTP_ERROR: Mutex<Option<LastHttpError>> = const { Mutex::new(None) };
}

pub struct LastHttpError {
  pub status: u16,
  pub res: String,
}

pub trait OrHttpError<T> {
  fn or_http_error(self) -> Result<T>;
}

impl<T> OrHttpError<T> for Result<T> {
  fn or_http_error(self) -> Result<T> {
    let Some(http_error) = take_last_http_error() else {
      return self;
    };

    match self.as_ref() {
      Ok(_) => {
        warn!(target: TAG, "suspicious: last_http_error was set but provided Result is ok");
        warn!(target: TAG, "last_http_error ({}): {}", http_error.status, http_error.res);
        return self;
      }
      Err(_) => {
        let err = self.as_ref().err().unwrap();
        info!(target: TAG, "shadowing git error since last_http_error was set; original error: {}", err);
      }
    }

    Err(Error::Network { status: http_error.status, message: Some(http_error.res) }.into())
  }
}

#[no_mangle]
pub unsafe extern "C" fn set_last_http_error(status: u16, body: *mut u8, body_len: usize) {
  let body = Vec::from_raw_parts(body, body_len, body_len);
  let body_str = String::from_utf8_lossy(&body);
  LAST_HTTP_ERROR.with(move |err| {
    info!(target: TAG, "set last_http_error: code: {}; message:\n{}", status, body_str);
    err.lock().unwrap().replace(LastHttpError { status, res: body_str.to_string() });
  })
}

pub fn take_last_http_error() -> Option<LastHttpError> {
  LAST_HTTP_ERROR.with(|err| err.lock().unwrap().take())
}
