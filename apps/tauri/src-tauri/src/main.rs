#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(desktop)]
fn panic_hook(info: &std::panic::PanicInfo) {
  let backtrace = std::backtrace::Backtrace::force_capture();

  let mut message = {
    let current = std::thread::current();
    format!("{:?} <{}> crashed at: ", current.id(), current.name().unwrap_or("unnamed"))
  };

  message.push_str(&info.location().map(|l| l.to_string()).unwrap_or("unknown".to_string()));
  message.push_str("\n\n");

  let payload = info.payload();
  let panic_message = if let Some(payload) = payload.downcast_ref::<String>() {
    payload.to_owned()
  } else if let Some(payload) = payload.downcast_ref::<&'static str>() {
    payload.to_string()
  } else {
    "<no message>".to_string()
  };

  message.push_str(&format!("Panic message: {}\n\n", panic_message));
  message.push_str(&format!("Backtrace: \n{}", backtrace));

  rfd::MessageDialog::new()
    .set_title("Panic!")
    .set_level(rfd::MessageLevel::Error)
    .set_description(message)
    .set_buttons(rfd::MessageButtons::Ok)
    .show();
}

fn main() {
  #[cfg(desktop)]
  std::panic::set_hook(Box::new(panic_hook));
  gramax::run()
}
