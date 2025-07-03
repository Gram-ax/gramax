use std::collections::HashMap;
use std::sync::Mutex;

use tauri::*;

#[derive(Default, Debug)]
pub struct WindowSessionData(pub Mutex<HashMap<String, HashMap<String, String>>>);

pub trait WindowSessionDataExt {
  fn set_session_data(&self, key: &str, data: &str);
  fn get_session_data(&self) -> Option<HashMap<String, String>>;
}


impl<R: Runtime> WindowSessionDataExt for WebviewWindow<R> {
  fn set_session_data(&self, key: &str, data: &str) {
    let session_data = self
      .try_state::<WindowSessionData>()
      .unwrap_or_else(|| {
        self.manage(WindowSessionData::default());
        self.state()
      })
      .inner();

    let mut session_data = session_data.0.lock().unwrap();
    let session_data = session_data.entry(self.label().to_string()).or_default();

    session_data.insert(key.to_string(), data.to_string());
  }

  fn get_session_data(&self) -> Option<HashMap<String, String>> {
    self.try_state::<WindowSessionData>().and_then(|s| s.0.lock().unwrap().get(self.label()).cloned())
  }
}
