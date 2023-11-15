use cacao::objc::*;
use tauri::*;

use cacao::foundation::NSURL;
use cacao::objc::runtime::Object;
use std::ptr::null;
use url::Url;

use const_format::formatcp;

pub fn window_post_init<R: Runtime>(window: &Window<R>) -> Result<()> {
  window.with_webview(|wv| {
    #[cfg(target_os = "ios")]
    unsafe {
      UIVIEW_CONTROLLER = wv.view_controller();
    }
  })
}

static mut START_OAUTH_SESSION: Option<extern "C" fn(*const Object, *const Object)> = None;
static mut UIVIEW_CONTROLLER: *const Object = null::<Object>();

#[no_mangle]
unsafe extern "C" fn register_oauth_start(start_auth: extern "C" fn(*const Object, *const Object)) {
  START_OAUTH_SESSION = Some(start_auth);
}

pub(super) unsafe fn on_ios_navigate(url: &Url) -> bool {
  let url = url.as_str();
  let nsurl = NSURL::with_str(url);
  if url.contains(formatcp!("{}{}", env!("ENTERPRISE_SERVER_URL"), "/auth")) {
    if let Some(start_auth) = START_OAUTH_SESSION {
      start_auth(&*nsurl.objc, UIVIEW_CONTROLLER);
    }
    return false;
  }

  let options: *const Object = msg_send![class!(NSDictionary), new];
  let handler: *const () = null();
  let app: *const Object = msg_send![class!(UIApplication), sharedApplication];
  let _: () = msg_send![app, openURL: nsurl options: options completionHandler: handler];

  false
}
