use android_intent::*;
use tauri::*;
use url::Url;

pub fn window_post_init<R: Runtime>(_: &Window<R>) -> Result<()> {
  Ok(())
}

pub(super) fn on_android_navigate(url: &Url) -> bool {
  with_current_env(|env| Intent::new_with_uri(env, Action::View, url).start_activity().unwrap());
  false
}