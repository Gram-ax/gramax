use cacao::objc::*;
use tauri::*;

use cacao::foundation::NSURL;
use cacao::objc::runtime::Object;
use std::ptr::null;
use std::sync::OnceLock;
use url::Url;

pub fn window_post_init<R: Runtime>(window: &Window<R>) -> Result<()> {
  window.with_webview(|wv| unsafe {
    UIVIEW_CONTROLLER = wv.view_controller();
  })
}

static mut START_OAUTH_SESSION: Option<extern "C" fn(*const Object, *const Object)> = None;
static mut UIVIEW_CONTROLLER: *const Object = null::<Object>();

#[no_mangle]
unsafe extern "C" fn register_oauth_start(start_auth: extern "C" fn(*const Object, *const Object)) {
  START_OAUTH_SESSION = Some(start_auth);
}

pub(super) unsafe fn on_ios_navigate(url: &Url) -> bool {
  static AUTH_URL: OnceLock<String> = OnceLock::new();

  let auth_url = AUTH_URL.get_or_init(|| {
    format!("{}/{}", env!("ENTERPRISE_SERVER_URL"), "/auth")
  });

  let url = url.as_str();
  let nsurl = NSURL::with_str(url);
  if url.contains(auth_url) {
    if let Some(start_auth) = START_OAUTH_SESSION {
      start_auth(&*nsurl.objc, UIVIEW_CONTROLLER);
    }
    return false;
  }

  let options: *const Object = msg_send![class!(NSDictionary), new];
  let app: *const Object = msg_send![class!(UIApplication), sharedApplication];
  let _: () = msg_send![app, openURL: nsurl options: options completionHandler: null::<*const ()>()];
  false
}
