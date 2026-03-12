use std::borrow::Cow;
use std::collections::HashSet;
use std::sync::Arc;
use std::sync::Mutex;
use std::time::Duration;

use humansize::FormatSizeOptions;
use opentelemetry::KeyValue;
use sysinfo::Pid;
use sysinfo::ProcessRefreshKind;

use tauri::*;
use tracing::Span;
use tracing_opentelemetry::OpenTelemetrySpanExt;

const FAST_DELAY: Duration = Duration::from_secs(60);
const SLOW_DELAY: Duration = Duration::from_secs(60 * 10);

#[derive(serde::Serialize, Clone, Debug)]
pub struct ProcessInfo {
	pid: i32,
	parent_pid: Option<u32>,
	name: String,
	rss: u64,
	open_files: usize,
	run: u64,
	cpu_usage: f32,
	is_main: bool,
}

impl std::fmt::Display for ProcessInfo {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		write!(
			f,
			"{name} ({pid}): rss: {rss}, files: {open_files}, run for: {run:?}, cpu: {cpu_usage:.2}%",
			name = self.name,
			pid = self.pid,
			rss = humansize::format_size(self.rss, FormatSizeOptions::default()),
			open_files = self.open_files,
			run = Duration::from_millis(self.run),
			cpu_usage = self.cpu_usage
		)
	}
}

impl From<&sysinfo::Process> for ProcessInfo {
	fn from(process: &sysinfo::Process) -> Self {
		Self {
			pid: process.pid().as_u32() as i32,
			parent_pid: process.parent().map(|p| p.as_u32()),
			name: process.name().to_string_lossy().to_string(),
			rss: process.memory(),
			open_files: process.open_files().unwrap_or(0),
			run: process.run_time(),
			cpu_usage: process.cpu_usage(),
			is_main: process.pid().as_u32() == std::process::id(),
		}
	}
}

#[derive(serde::Serialize, Clone, Debug)]
pub struct WatchSample {
	data: Vec<ProcessInfo>,
}

impl WatchSample {
	pub fn new() -> Self {
		Self { data: Vec::new() }
	}

	pub fn total_rss(&self) -> i64 {
		self.data.iter().map(|p| p.rss as i64).sum()
	}

	pub fn total_open_files(&self) -> i64 {
		self.data.iter().map(|p| p.open_files as i64).sum()
	}

	pub fn total_cpu_usage(&self) -> f64 {
		self.data.iter().map(|p| p.cpu_usage as f64).sum()
	}
}

impl std::fmt::Display for WatchSample {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		for process in &self.data {
			writeln!(f, "{}", process)?;
		}
		Ok(())
	}
}

pub struct WatchedProcesses<R: Runtime> {
	app: AppHandle<R>,
	pids: Vec<Pid>,
	system: sysinfo::System,
	need_update: bool,
}

impl<R: Runtime> WatchedProcesses<R> {
	fn new(app: AppHandle<R>) -> Result<Self> {
		let pids = Vec::new();
		let system = sysinfo::System::new();

		Ok(Self {
			app,
			pids,
			system,
			need_update: true,
		})
	}

	fn update_process_infos(&mut self) -> Result<WatchSample> {
		for _ in 0..=1 {
			self.system.refresh_processes_specifics(
				sysinfo::ProcessesToUpdate::Some(self.pids.as_slice()),
				true,
				ProcessRefreshKind::nothing().with_cpu().with_memory(),
			);

			std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
		}

		let mut sample = WatchSample::new();

		for pid in self.pids.iter() {
			let Some(process) = self.system.process(pid.clone()) else {
				continue;
			};

			sample.data.push(ProcessInfo::from(process));
		}

		sample.data.sort_by_key(|p| p.is_main);
		Ok(sample)
	}

	fn find_app_related_processes(&mut self) -> Result<()> {
		let mut pids = HashSet::new();

		self
			.system
			.refresh_processes_specifics(sysinfo::ProcessesToUpdate::All, true, ProcessRefreshKind::nothing());

		pids.insert(Pid::from_u32(std::process::id() as u32));
		self.update_child_processes(Pid::from_u32(std::process::id() as u32), &mut pids);

		for (_, wv) in self.app.webview_windows() {
			let Some(pid) = get_webview_pid(&wv)? else {
				continue;
			};

			let pid = Pid::from_u32(pid as u32);
			pids.insert(pid);
			self.update_child_processes(pid.clone(), &mut pids);
		}

		self.pids = pids.into_iter().collect();

		Ok(())
	}

	fn update_child_processes(&self, parent_pid: Pid, out: &mut HashSet<Pid>) {
		for (pid, _) in self
			.system
			.processes()
			.iter()
			.filter(|(_, p)| p.parent().is_some_and(|p| p == parent_pid))
		{
			out.insert(pid.clone());
		}
	}
}

pub fn init_mem_watching<R: Runtime>(app: &AppHandle<R>) -> Result<()> {
	let watcher = WatchedProcesses::new(app.clone())?;
	_ = app.manage(Arc::new(Mutex::new(watcher)));

	let mut counter = 0;

	let app = app.clone();
	std::thread::spawn(move || loop {
		std::thread::sleep(FAST_DELAY);

		tracing::info_span!(target: "mem", "usage").in_scope(|| {
			let watcher = app.state::<Arc<Mutex<WatchedProcesses<R>>>>();
			let mut watcher = watcher.lock().unwrap();

			counter += 1;

			if FAST_DELAY.as_secs() * counter >= SLOW_DELAY.as_secs() || watcher.need_update {
				counter = 0;
				if let Err(e) = watcher.find_app_related_processes() {
					Span::current().set_status(opentelemetry::trace::Status::Error {
						description: Cow::Owned(e.to_string()),
					});
				}
			}

			match watcher.update_process_infos() {
				Ok(sample) => {
					let mut event_kv = vec![
						KeyValue::new("total.rss", sample.total_rss()),
						KeyValue::new("total.open_files", sample.total_open_files()),
						KeyValue::new("total.cpu", sample.total_cpu_usage()),
					];

					for process in sample.data.iter() {
						info!("{}", process);
						event_kv.push(KeyValue::new(format!("{}.rss", process.name), process.rss as i64));
						event_kv.push(KeyValue::new(format!("{}.cpu", process.name), process.cpu_usage as i64));
						event_kv.push(KeyValue::new(format!("{}.run", process.name), process.run as i64));
					}

					tracing::Span::current().add_event("raw probe", event_kv);
				}
				Err(e) => {
					Span::current().set_status(opentelemetry::trace::Status::Error {
						description: Cow::Owned(e.to_string()),
					});
				}
			}
		});
	});

	Ok(())
}

pub fn force_find_processes<R: Runtime>(app: &AppHandle<R>) -> Result<()> {
	let watcher = app.state::<Arc<Mutex<WatchedProcesses<R>>>>();
	watcher.lock().unwrap().need_update = true;
	Ok(())
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
}
