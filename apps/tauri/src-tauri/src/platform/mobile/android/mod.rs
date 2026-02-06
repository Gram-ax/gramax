use android_intent::*;
use url::Url;

pub mod init;

pub(super) fn on_android_navigate(url: &Url) -> bool {
	with_current_env(|env| Intent::new_with_uri(env, Action::View, url).start_activity().unwrap());
	false
}
