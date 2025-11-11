#![cfg(not(target_family = "wasm"))]
#![cfg(any(target_os = "macos", target_os = "linux", target_os = "windows"))]

use sysinfo::Pid;
use sysinfo::System;

use tauri::*;

#[derive(Debug, Clone)]
pub struct GenericProcessMemoryInfo {
  pid: u32,
  parent_pid: Option<u32>,
  name: String,
  rss: u64,
  virtual_memory: u64,
  open_files: usize,
  run: u64,
  cpu_usage: f32,
  is_main: bool,
}

#[derive(Debug, Clone)]
pub enum ProcessMemoryInfo {
  Generic(GenericProcessMemoryInfo),
  Webview { wv_label: String, process: GenericProcessMemoryInfo },
  WebviewChild { parent_wv_label: String, process: GenericProcessMemoryInfo },
}

#[derive(Default, Debug, Clone)]
pub struct MemoryInfo(pub Vec<ProcessMemoryInfo>);

impl From<&sysinfo::Process> for GenericProcessMemoryInfo {
  fn from(process: &sysinfo::Process) -> Self {
    GenericProcessMemoryInfo {
      pid: process.pid().as_u32(),
      parent_pid: process.parent().map(|p| p.as_u32()),
      name: process.name().to_string_lossy().to_string(),
      rss: process.memory(),
      virtual_memory: process.virtual_memory(),
      open_files: process.open_files().unwrap_or(0),
      run: process.run_time(),
      cpu_usage: process.cpu_usage(),
      is_main: process.pid().as_u32() == std::process::id(),
    }
  }
}

impl ProcessMemoryInfo {
  pub fn pid(&self) -> u32 {
    self.process().pid
  }

  pub fn parent_pid(&self) -> Option<u32> {
    self.process().parent_pid
  }

  pub fn name(&self) -> &str {
    &self.process().name
  }

  pub fn rss(&self) -> u64 {
    self.process().rss
  }

  pub fn virtual_memory(&self) -> u64 {
    self.process().virtual_memory
  }

  pub fn open_files(&self) -> usize {
    self.process().open_files
  }

  pub fn run(&self) -> u64 {
    self.process().run
  }

  pub fn cpu_usage(&self) -> f32 {
    self.process().cpu_usage
  }

  pub fn is_main(&self) -> bool {
    self.process().is_main
  }

  pub fn process(&self) -> &GenericProcessMemoryInfo {
    match self {
      ProcessMemoryInfo::Generic(process) => process,
      ProcessMemoryInfo::Webview { process, .. } => process,
      ProcessMemoryInfo::WebviewChild { process, .. } => process,
    }
  }
}

impl MemoryInfo {
  pub fn total_rss(&self) -> u64 {
    self.0.iter().map(|p| p.rss()).sum()
  }

  pub fn total_cpu_usage(&self) -> f32 {
    self.0.iter().map(|p| p.cpu_usage()).sum()
  }

  pub fn total_open_files(&self) -> usize {
    self.0.iter().map(|p| p.open_files()).sum()
  }

  pub fn feed_process(&mut self, pid: Pid, system: &System) {
    if let Some(process) = system.process(pid) {
      self.0.push(ProcessMemoryInfo::Generic(process.into()));
      self.collect_child_processes(pid, system);
    }
  }

  pub fn feed_webview<R: Runtime>(&mut self, webview: &WebviewWindow<R>, system: &System) -> Result<()> {
    let Some(pid) = get_webview_pid(webview)? else {
      warn!("failed to get pid of webview: {}", webview.label());
      return Ok(());
    };

    let pid = Pid::from(pid as usize);

    if let Some(process) = system.process(pid) {
      self
        .0
        .push(ProcessMemoryInfo::Webview { wv_label: webview.label().to_string(), process: process.into() });
      self.collect_webview_child_processes(pid, system, webview);
    }

    Ok(())
  }

  fn collect_child_processes(&mut self, parent_pid: Pid, system: &System) {
    for (pid, process) in
      system.processes().iter().filter(|(_, p)| p.parent().is_some_and(|p| p == parent_pid))
    {
      self.0.push(ProcessMemoryInfo::Generic(process.into()));
      self.collect_child_processes(*pid, system);
    }
  }

  fn collect_webview_child_processes<R: Runtime>(
    &mut self,
    parent_pid: Pid,
    system: &System,
    webview: &WebviewWindow<R>,
  ) {
    for (pid, process) in
      system.processes().iter().filter(|(_, p)| p.parent().is_some_and(|p| p == parent_pid))
    {
      self.0.push(ProcessMemoryInfo::WebviewChild {
        parent_wv_label: webview.label().to_string(),
        process: process.into(),
      });
      self.collect_child_processes(*pid, system);
    }
  }
}

#[allow(clippy::needless_return)]
fn get_webview_pid<R: Runtime>(webview: &WebviewWindow<R>) -> Result<Option<i32>> {
  #[cfg(target_os = "macos")]
  {
    return macos_get_webview_pid(webview);
  }

  #[cfg(target_os = "windows")]
  {
    return windows_get_webview_pid(webview);
  }

  #[cfg(target_os = "linux")]
  {
    return linux_get_webview_pid(webview);
  }
}

#[cfg(target_os = "macos")]
fn macos_get_webview_pid<R: Runtime>(webview: &WebviewWindow<R>) -> Result<Option<i32>> {
  let (tx, rx) = std::sync::mpsc::channel();

  webview.with_webview(move |wv| {
    let wv = wv.inner() as *mut objc2::runtime::AnyObject;
    let pid: i32 = unsafe { objc2::msg_send![wv, _webProcessIdentifier] };
    tx.send(pid).unwrap();
  })?;

  Ok(rx.recv().ok())
}

#[cfg(target_os = "windows")]
fn windows_get_webview_pid<R: Runtime>(webview: &WebviewWindow<R>) -> Result<Option<i32>> {
  let (tx, rx) = std::sync::mpsc::channel();

  webview.with_webview(move |webview| unsafe {
    let controller = webview.controller();
    let Ok(core_webview) = controller.CoreWebView2() else {
      warn!("failed to get core webview");
      return;
    };

    let mut browser_pid: u32 = 0;
    if let Err(e) = core_webview.BrowserProcessId(&mut browser_pid) {
      warn!("failed to get browser process id: {}", e);
      return;
    }

    tx.send(browser_pid as i32).unwrap();
  })?;

  Ok(rx.recv().ok())
}

#[cfg(target_os = "linux")]
fn linux_get_webview_pid<R: Runtime>(webview: &WebviewWindow<R>) -> Result<Option<i32>> {
  Ok(None)
  // let mut pid_result = None;
  // let _ = webview.with_webview(|wv| {
  //   use gtk::prelude::*;

  //   if let Some(gtk_widget) = wv.gtk_widget() {
  //     let gtk_window = gtk_widget.get_toplevel().and_then(|w| w.downcast::<gtk::Window>().ok());
  //     if let Some(gtk_window) = gtk_window {
  //       if let Some(xid) = gtk_window.window().map(|w| w.get_xid()) {
  //         pid_result = get_pid_from_xid(xid).map(|p| p as i32).or(Some(std::process::id() as i32));
  //       } else {
  //         pid_result = Some(std::process::id() as i32);
  //       }
  //     } else {
  //       pid_result = Some(std::process::id() as i32);
  //     }
  //   } else {
  //     pid_result = Some(std::process::id() as i32);
  //   }
  // });
  // Ok(pid_result)
}

// #[cfg(target_os = "linux")]
// fn get_pid_from_xid(xid: u32) -> Option<u32> {
//   use std::process::Command;

//   let pid_output = Command::new("xdotool").arg("getwindowpid").arg(xid.to_string()).output().ok()?;

//   if pid_output.status.success() {
//     let pid_str = String::from_utf8(pid_output.stdout).ok()?;
//     return pid_str.trim().parse().ok();
//   }

//   None
// }
