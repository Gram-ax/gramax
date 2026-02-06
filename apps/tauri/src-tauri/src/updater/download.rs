use std::sync::atomic::AtomicU64;
use std::sync::atomic::AtomicUsize;
use std::sync::atomic::Ordering;

use std::path::PathBuf;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;

use serde::Serialize;

use tauri::*;
use tauri_plugin_updater as inner;

const TAG: &str = "updater";

const EMIT_INTERVAL: u64 = 300;
const MAX_CACHE_SIZE: usize = 6;

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateIncoming {
	pub version: String,
	pub pub_date: Option<String>,
}

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDownloadProgress {
	pub bytes: usize,
	pub chunk: usize,
	pub total: Option<usize>,
	pub bytes_per_sec: f32,
	pub eta_sec: Option<f32>,
}

impl std::fmt::Display for UpdateDownloadProgress {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		write!(
			f,
			"{bytes:.2}mb / {total:.2}mb ({bytes_per_sec:.2}mb/s, eta: {eta_sec:.2}s, chunk: {chunk:.2}mb)",
			bytes = self.bytes as f32 / 1024.0 / 1024.0,
			total = self.total.unwrap_or(0) as f32 / 1024.0 / 1024.0,
			bytes_per_sec = self.bytes_per_sec / 1024.0 / 1024.0,
			eta_sec = self.eta_sec.unwrap_or(0.0),
			chunk = self.chunk as f32 / 1024.0 / 1024.0,
		)
	}
}

pub struct UpdateCache<R: Runtime> {
	app: AppHandle<R>,
}

impl<R: Runtime> UpdateCache<R> {
	pub fn new(app: AppHandle<R>) -> Self {
		Self { app }
	}

	pub async fn prepare_to_install(&self, update: &inner::Update) -> inner::Result<Vec<u8>> {
		if let Some(bytes) = self.lookup(&update.remote_release)? {
			return Ok(bytes);
		}

		let downloader = UpdateDownload::new(self.app.clone(), update);
		let bytes = downloader.download().await?;

		self.save(&bytes, &update.remote_release)?;
		Ok(bytes)
	}

	pub fn lookup(&self, release: &inner::RemoteRelease) -> inner::Result<Option<Vec<u8>>> {
		let target = inner::target().ok_or(inner::Error::UnsupportedOs)?;
		let signature = release.signature(&target)?;

		let archive_path = self.cached_update_path(&release.version.to_string())?;

		if !archive_path.exists() {
			info!(target: TAG, "no update found in cache ({})", archive_path.display());
			return Ok(None);
		}

		let bytes = std::fs::read(&archive_path)?;
		if let Err(err) = self.verify(signature, &bytes) {
			warn!(target: TAG, "failed to verify signature for update: {}; err: {}", release.version, err);
			return Ok(None);
		}

		info!(target: TAG, "update found in cache ({})", archive_path.display());
		Ok(Some(bytes))
	}

	pub fn save(&self, bytes: &[u8], release: &inner::RemoteRelease) -> inner::Result<()> {
		let archive_path = self.cached_update_path(&release.version.to_string())?;
		let target = inner::target().ok_or(inner::Error::UnsupportedOs)?;
		let signature = release.signature(&target)?;

		self.verify(signature, bytes)?;
		self.remove_obsolete_updates()?;

		std::fs::write(archive_path, bytes)?;
		Ok(())
	}

	pub fn clear(&self) -> inner::Result<()> {
		let dir = self.cached_updates_dir()?;
		if dir.exists() {
			std::fs::remove_dir_all(&dir)?;
		}
		std::fs::create_dir_all(&dir)?;
		Ok(())
	}

	pub fn cached_updates_dir(&self) -> Result<PathBuf> {
		self.app.path().app_data_dir().map(|dir| dir.join("updates"))
	}

	pub fn cached_update_path(&self, version: &str) -> Result<PathBuf> {
		let dir = self.cached_updates_dir()?;
		std::fs::create_dir_all(&dir)?;
		Ok(dir.join(format!("{version}.tar.gz")))
	}

	pub fn verify(&self, sig: &str, bytes: &[u8]) -> inner::Result<()> {
		let pubkey = self
			.app
			.config()
			.plugins
			.0
			.get("updater")
			.and_then(|updater| updater.get("pubkey"))
			.and_then(|pubkey| pubkey.as_str())
			.expect("pubkey is not set");

		tauri_plugin_updater::verify_signature(bytes, sig, pubkey)?;
		Ok(())
	}

	fn remove_obsolete_updates(&self) -> inner::Result<()> {
		let dir = self.cached_updates_dir()?;

		let mut files = std::fs::read_dir(dir)?
			.filter_map(|e| e.ok())
			.filter_map(|e| {
				let created = e.metadata().map(|m| m.created().unwrap()).ok();
				created.map(|t| (e.path(), SystemTime::now().duration_since(t).unwrap()))
			})
			.collect::<Vec<_>>();

		files.sort_by_key(|(_, diff)| diff.as_secs());

		for (path, diff) in files.iter().skip(MAX_CACHE_SIZE) {
			info!(target: TAG, "removing obsolete update: {} ({} days old)", path.display(), diff.as_secs() / 3600 / 24);
			std::fs::remove_file(path)?;
		}

		Ok(())
	}
}

pub struct UpdateDownload<'a, R: Runtime> {
	app: AppHandle<R>,
	update: &'a inner::Update,

	last_emit_timestamp: AtomicU64,
	last_bytes: AtomicUsize,
	accumulated_bytes: AtomicUsize,
}

impl<'a, R: Runtime> UpdateDownload<'a, R> {
	pub fn new(app: AppHandle<R>, update: &'a inner::Update) -> Self {
		Self {
			app,
			update,
			last_emit_timestamp: AtomicU64::default(),
			last_bytes: AtomicUsize::default(),
			accumulated_bytes: AtomicUsize::default(),
		}
	}

	pub async fn download(&self) -> inner::Result<Vec<u8>> {
		let ev = UpdateIncoming {
			version: self.update.version.clone(),
			pub_date: self.update.date.map(|d| d.to_string()),
		};

		self.app.emit("update:incoming", ev)?;

		let bytes = self
			.update
			.download(|bytes, total| self.on_chunk(bytes, total), || self.on_finish())
			.await?;
		Ok(bytes)
	}

	fn on_chunk(&self, bytes: usize, total: Option<u64>) {
		let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();
		let now = now.as_secs() * 1000 + now.subsec_millis() as u64;

		let time_passed = now - self.last_emit_timestamp.load(Ordering::Relaxed);

		self.accumulated_bytes.fetch_add(bytes, Ordering::Relaxed);

		if time_passed < EMIT_INTERVAL {
			return;
		}

		let bytes = self.accumulated_bytes.swap(0, Ordering::Relaxed);

		self.last_emit_timestamp.store(now, Ordering::Relaxed);
		let downloaded_bytes = self.last_bytes.fetch_add(bytes, Ordering::Relaxed);
		let current_bytes = downloaded_bytes + bytes;

		let bytes_per_sec = (current_bytes - downloaded_bytes) as f32 / (time_passed as f32 / 1000.0);
		let eta_sec = total.map(|t| (t as usize - current_bytes) as f32 / bytes_per_sec);

		let progress = UpdateDownloadProgress {
			bytes: current_bytes,
			chunk: bytes,
			total: total.map(|t| t as usize),
			bytes_per_sec,
			eta_sec,
		};

		info!(target: TAG, "downloading update: {progress}");

		if let Err(e) = self.app.emit("update:downloading", progress) {
			error!(target: TAG, "failed to emit `update:downloading`: {e}");
		}
	}

	fn on_finish(&self) {
		info!(target: TAG, "download finished");
	}
}
