use std::panic::PanicInfo;

use bugsnag::BugsnagNotificationBuilder;

pub fn setup_bugsnag_and_panic_hook(api_key: String) -> BugsnagNotificationBuilder {
  let webview_version = tauri::webview_version().unwrap_or("unknown".to_string());

  let bugsnag = BugsnagNotificationBuilder::new(api_key, webview_version);
  let bugsnag_hook = bugsnag.clone();
  std::panic::set_hook(Box::new(move |info: &PanicInfo| panic_hook(&bugsnag_hook, info)));
  bugsnag
}

fn panic_hook(bugsnag: &BugsnagNotificationBuilder, panic_info: &PanicInfo) {
  let payload = panic_info.payload();
  let panic_message = if let Some(payload) = payload.downcast_ref::<String>() {
    payload.to_owned()
  } else if let Some(payload) = payload.downcast_ref::<&'static str>() {
    payload.to_string()
  } else {
    "<no message>".to_string()
  };

  let notification = bugsnag.from_panic(panic_info);
  notification.blocking_send();

  let message = format!(
    r#"
Unfortunately, Gramax was crashed (panicked).

Thread {thread_id} ({thread_name}) panicked at:
{location}

With error message:
{message}
"#,
    thread_id = format!("{:?}", std::thread::current().id()).replace("ThreadId(", "").replace(")", ""),
    thread_name = std::thread::current().name().unwrap_or("<unnamed>"),
    location = &panic_info.location().map(|l| l.to_string()).unwrap_or("unknown location".to_string()),
    message = panic_message
  );

  rfd::MessageDialog::new()
    .set_title("Gramax was crashed")
    .set_level(rfd::MessageLevel::Error)
    .set_description(message)
    .set_buttons(rfd::MessageButtons::Ok)
    .show();
}
