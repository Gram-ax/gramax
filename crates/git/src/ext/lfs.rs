use git2::build::CheckoutBuilder;
use git2::*;
use git2_lfs::ext::RepoLfsExt;
use git2_lfs::Pointer;
use url::Url;

use std::path::PathBuf;
use std::time::Duration;

use crate::cancel_token::CancelToken;
use crate::prelude::Branch;
use crate::prelude::*;
use crate::Result;

const TAG: &str = "git:lfs";

#[cfg(any(target_os = "macos", target_os = "linux", target_os = "windows"))]
const CONCURRENCY_LIMIT: usize = 16;

#[cfg(target_family = "wasm")]
const CONCURRENCY_LIMIT: usize = 2;

type OnProgress<'a> = Option<Box<git2_lfs::remote::OnProgress<'a>>>;

const CHUNK_TIME_SPAN: Duration = Duration::from_secs(1);

pub trait Lfs {
	fn push_lfs_objects(&self, remote: &git2::Remote<'_>, callback: OnProgress, cancel: CancelToken) -> Result<()>;

	fn pull_lfs_objects_exact(&self, files: Vec<PathBuf>, checkout: bool, callback: OnProgress, cancel: CancelToken) -> Result<()>;

	fn pull_lfs_objects_by_tree(&self, tree: &Tree, callback: OnProgress, cancel: CancelToken) -> Result<()>;

	fn pull_lfs_objects_by_head(&self, callback: OnProgress, cancel: CancelToken) -> Result<()>;

	fn pull_lfs_objects(&self, objects: &[Pointer], callback: OnProgress, cancel: CancelToken) -> Result<()>;

	fn is_lazy_lfs_enabled(&self) -> Result<bool>;

	fn set_lazy_lfs_enabled(&self, enabled: bool) -> Result<()>;
}

pub(crate) fn lfs_init_once() {
	static ONCE: std::sync::Once = std::sync::Once::new();

	ONCE.call_once(|| {
		git2_lfs::LfsBuilder::default().install("filter=lfs").unwrap();
	});
}

pub(crate) fn make_lfs_callback<'a>(callback: RemoteProgressCallback<'a>, cancel: CancelToken<'a>) -> OnProgress<'a> {
	use crate::time_now;
	use std::cell::RefCell;

	let now = RefCell::new(time_now() - CHUNK_TIME_SPAN);
	let bytes_handled = RefCell::new(0);

	let callback = Box::new(move |progress: git2_lfs::remote::Progress| {
		if time_now() - *now.borrow() < CHUNK_TIME_SPAN {
			return;
		}

		let prev_time = now.replace(time_now());
		let prev_bytes_handled = bytes_handled.replace(progress.bytes_handled());

		let delta_time = (*now.borrow() - prev_time).as_secs_f64();
		let delta_bytes = progress.bytes_handled() - prev_bytes_handled;

		let download_speed_bytes = (delta_bytes as f64 / delta_time) as usize;

		callback(RemoteProgress::Lfs {
			id: cancel.id(),
			is_cancelled: cancel.is_cancelled(),
			download_speed_bytes,
			data: progress,
		});
	});

	Some(callback)
}

impl<C: ActualCreds> Lfs for Repo<'_, C> {
	fn is_lazy_lfs_enabled(&self) -> Result<bool> {
		Ok(
			self
				.0
				.config()?
				.open_level(ConfigLevel::Local)?
				.get_bool("lfs.lazy")
				.ok()
				.is_none_or(|l| l),
		)
	}

	fn set_lazy_lfs_enabled(&self, enabled: bool) -> Result<()> {
		self.0.config()?.open_level(ConfigLevel::Local)?.set_bool("lfs.lazy", enabled)?;
		Ok(())
	}

	fn push_lfs_objects(&self, remote: &git2::Remote<'_>, callback: OnProgress, cancel: CancelToken) -> Result<()> {
		let local_branch = self.branch_by_head()?;

		let upstream = local_branch
			.upstream()
			.inspect_err(
				|e| warn!(target: TAG, "push: can not find upstream for branch {}: {}", local_branch.name().unwrap_or_default().unwrap_or_default(), e),
			)
			.ok();

		let head = local_branch.get();

		let objects_to_push = match upstream {
			Some(upstream) => self.0.find_lfs_objects_to_push(head, Some(upstream.get()))?,
			None => {
				let default_branch = self.default_branch()?;
				self.0.find_lfs_objects_to_push(head, default_branch.as_ref().map(|b| b.get()))?
			}
		};

		if objects_to_push.is_empty() {
			info!(target: TAG, "no lfs objects to push; skip");
			return Ok(());
		}

		info!(target: TAG, "found {} objects to push", objects_to_push.len());

		let Some(mut url) = remote.url().and_then(|u| u.parse::<Url>().ok()) else {
			error!(target: TAG, "remote has no url; skipping lfs pull");
			return Ok(());
		};

		url
			.path_segments_mut()
			.map_err(|_| git2::Error::from_str("invalid url"))?
			.push("info")
			.push("lfs");

		#[cfg(any(target_os = "macos", target_os = "linux", target_os = "windows"))]
		reqwest::push(&self.0, url, Some(self.1.access_token().to_string()), &objects_to_push, callback, cancel)?;

		#[cfg(target_family = "wasm")]
		wasm::push(&self.0, url, Some(self.1.access_token().to_string()), &objects_to_push, callback, cancel)?;

		Ok(())
	}

	fn pull_lfs_objects_exact(&self, paths: Vec<PathBuf>, checkout: bool, callback: OnProgress, cancel: CancelToken) -> Result<()> {
		let lfs_objects_path = self.0.path().join("lfs/objects");

		let pointers = paths
			.iter()
			.map(|path| self.0.try_get_dangling_pointer(path.as_path()).map(|p| (path, p)))
			.flatten()
			.filter_map(|p| p.1.map(|ptr| (p.0, ptr)))
			.collect::<Vec<(&PathBuf, Pointer)>>();

		let pointers_pull_needed = pointers
			.iter()
			.map(|p| &p.1)
			.filter(|p| !lfs_objects_path.join(p.path()).exists())
			.cloned()
			.collect::<Vec<Pointer>>();

		info!(target: TAG, paths = ?paths, pointers = ?pointers, pointers_pull_needed = ?pointers_pull_needed, "resolved {} dangling pointers ({} needed to be pulled) of {} provided paths", pointers.len(), pointers_pull_needed.len(), paths.len());

		self.pull_lfs_objects(&pointers_pull_needed, callback, cancel)?;

		if !checkout {
			return Ok(());
		}

		let Some(workdir) = self.0.workdir() else {
			warn!(target: TAG, "workdir not found; skipping checkout even if `checkout` is true");
			return Ok(());
		};

		let mut checkout_opts = CheckoutBuilder::new();
		checkout_opts.force();
		paths.iter().for_each(|path| {
			_ = std::fs::remove_file(workdir.join(path)).inspect_err(|err| warn!(target: TAG, "failed to remove file {}: {}", path.display(), err));
			checkout_opts.path(path);
		});

		self
			.0
			.checkout_tree(&self.0.head()?.peel_to_tree()?.as_object(), Some(&mut checkout_opts))?;
		Ok(())
	}

	fn pull_lfs_objects_by_head(&self, callback: OnProgress, cancel: CancelToken) -> Result<()> {
		let head = self.0.head()?;
		let upstream = self
			.branch_by_head()?
			.upstream()
			.inspect_err(|e| warn!(target: TAG, "pull: can not find upstream for branch {}: {}", head.shorthand().unwrap_or_default(), e));

		if let Ok(upstream) = upstream {
			let tree = upstream.get().peel_to_tree()?;
			self.pull_lfs_objects_by_tree(&tree, callback, cancel)
		} else {
			Ok(())
		}
	}

	fn pull_lfs_objects_by_tree(&self, tree: &Tree, callback: OnProgress, cancel: CancelToken) -> Result<()> {
		let missing = self.0.find_tree_missing_lfs_objects(tree)?;

		if missing.is_empty() {
			return Ok(());
		}

		info!(target: TAG, "found {} missing LFS objects; pulling", missing.len());

		self.pull_lfs_objects(&missing, callback, cancel)
	}

	fn pull_lfs_objects(&self, objects: &[Pointer], callback: OnProgress, cancel: CancelToken) -> Result<()> {
		if objects.is_empty() {
			return Ok(());
		}

		let remote = self.0.find_remote("origin")?;
		let remote = self.ensure_remote_has_postfix(remote)?;

		let Some(mut url) = remote.url().and_then(|u| u.parse::<Url>().ok()) else {
			error!(target: TAG, "remote has no url; skipping lfs pull");
			return Ok(());
		};

		url
			.path_segments_mut()
			.map_err(|_| git2::Error::from_str("invalid url"))?
			.push("info")
			.push("lfs");

		#[cfg(any(target_os = "macos", target_os = "linux", target_os = "windows"))]
		reqwest::pull(&self.0, url, Some(self.1.access_token().to_string()), &objects, callback, cancel)?;

		#[cfg(target_family = "wasm")]
		wasm::pull(&self.0, url, Some(self.1.access_token().to_string()), &objects, callback, cancel)?;

		Ok(())
	}
}

#[cfg(any(target_os = "macos", target_os = "linux", target_os = "windows"))]
mod reqwest {
	use git2_lfs::remote::reqwest::ReqwestLfsClient;
	use git2_lfs::remote::LfsClient;
	use git2_lfs::Pointer;

	use url::Url;

	use crate::cancel_token::CancelToken;
	use crate::Result;

	use super::OnProgress;

	pub fn pull(
		repo: &git2::Repository,
		url: Url,
		access_token: Option<String>,
		missing: &[Pointer],
		callback: OnProgress,
		cancel: CancelToken,
	) -> Result<()> {
		let client = ReqwestLfsClient::new(url, access_token);
		let lfs_client = LfsClient::new(repo, client)
			.concurrency_limit(super::CONCURRENCY_LIMIT)
			.on_progress(callback);

		tokio::task::block_in_place(|| {
			tokio::runtime::Handle::current().block_on(async {
				tokio::select! {
					result = lfs_client.pull(missing) => result,
					_ = async {
						while !cancel.is_cancelled() {
							tokio::time::sleep(tokio::time::Duration::from_millis(150)).await;
						}
					} => Ok(())
				}
			})
		})
		.map_err(git2_lfs::Error::from)?;

		Ok(())
	}

	pub fn push(
		repo: &git2::Repository,
		url: Url,
		access_token: Option<String>,
		objects: &[Pointer],
		callback: OnProgress,
		cancel: CancelToken,
	) -> Result<()> {
		let client = ReqwestLfsClient::new(url, access_token);
		let lfs_client = LfsClient::new(repo, client)
			.concurrency_limit(super::CONCURRENCY_LIMIT)
			.on_progress(callback);

		tokio::task::block_in_place(|| {
			tokio::runtime::Handle::current().block_on(async {
				tokio::select! {
					result = lfs_client.push(objects) => result,
					_ = async {
						while !cancel.is_cancelled() {
							tokio::time::sleep(tokio::time::Duration::from_millis(150)).await;
						}
					} => Ok(())
				}
			})
		})
		.map_err(git2_lfs::Error::from)?;

		Ok(())
	}
}

#[cfg(target_family = "wasm")]
pub mod wasm {
	use std::ffi::c_char;
	use std::str::FromStr;
	use std::sync::Mutex;

	use git2_lfs::remote::BatchObject;
	use git2_lfs::remote::BatchRequest;
	use git2_lfs::remote::BatchResponse;
	use git2_lfs::remote::LfsClient;
	use git2_lfs::Pointer;

	use git2_lfs::remote::ObjectAction;
	use git2_lfs::remote::RemoteError;
	use git2_lfs::remote::Write;

	use git2_lfs::sha2::Digest;
	use git2_lfs::sha2::Sha256;
	use url::Url;

	use super::OnProgress;

	use crate::cancel_token::CancelToken;

	const USER_AGENT: &str = "gx-lfs/0.0.0";

	extern "C" {
		fn em_lfs_http_init(url: *const c_char, buf_size: usize, method: *const c_char, access_token: *const c_char) -> i32;
		fn em_lfs_http_set_header(id: i32, header: *const c_char, value: *const c_char);
		fn em_lfs_http_send(id: i32, body: *const c_char, len: usize) -> i32;
		fn em_http_read(id: i32, ptr: *const u8, len: usize) -> i32;
		fn em_http_free(id: i32);
	}

	pub struct WasmLfsClient {
		url: Url,
		access_token: Option<String>,

		active_conn_id: Mutex<i32>,
	}

	impl WasmLfsClient {
		pub fn new(url: Url, access_token: Option<String>) -> Self {
			Self {
				url,
				access_token,
				active_conn_id: Mutex::new(0),
			}
		}

		fn free_current_conn(&self) {
			let mut active_conn_id = self.active_conn_id.lock().unwrap();
			if *active_conn_id > 0 {
				unsafe { em_http_free(*active_conn_id) };
				*active_conn_id = 0;
			}
		}
	}

	impl Drop for WasmLfsClient {
		fn drop(&mut self) {
			self.free_current_conn();
		}
	}

	#[async_trait::async_trait]
	impl git2_lfs::remote::LfsRemote for WasmLfsClient {
		async fn batch(&self, req: BatchRequest) -> Result<BatchResponse, RemoteError> {
			const BUF_SIZE: usize = 1024;

			let mut batch_url = self.url.clone();

			batch_url
				.path_segments_mut()
				.map_err(|_| RemoteError::UrlParse(url::ParseError::RelativeUrlWithoutBase))?
				.pop_if_empty()
				.push("objects")
				.push("batch");

			let token = self.access_token.clone();

			let batch_url_cstr = std::ffi::CString::new(batch_url.as_str()).unwrap();
			let method_cstr = std::ffi::CString::new("POST").unwrap();
			let access_token_cstr = std::ffi::CString::new(token.as_deref().unwrap_or("")).unwrap();

			let body = serde_json::to_string(&req).map_err(|e| RemoteError::Custom(Box::new(e)))?;

			let body_cstr = std::ffi::CString::new(body.as_str()).unwrap();

			let conn_id = unsafe { em_lfs_http_init(batch_url_cstr.as_ptr(), BUF_SIZE, method_cstr.as_ptr(), access_token_cstr.as_ptr()) };

			if conn_id <= 0 {
				let err = std::io::Error::other("failed to initialize http connection");
				return Err(RemoteError::Custom(Box::new(err)));
			}

			*self.active_conn_id.lock().unwrap() = conn_id;

			unsafe {
				em_lfs_http_set_header(
					conn_id,
					std::ffi::CString::new("User-Agent").unwrap().as_ptr(),
					std::ffi::CString::new(USER_AGENT).unwrap().as_ptr(),
				)
			};

			let res = unsafe { em_lfs_http_send(conn_id, body_cstr.as_ptr(), 0) };
			handle_http_error(res)?;

			let mut total = Vec::new();
			let mut buf = [0; BUF_SIZE];
			let mut read = unsafe { em_http_read(conn_id, buf.as_mut_ptr(), buf.len()) };

			while read > 0 {
				total.extend_from_slice(&buf[..read as usize]);
				read = unsafe { em_http_read(conn_id, buf.as_mut_ptr(), buf.len()) };
				handle_http_error(read)?;
			}

			self.free_current_conn();

			let res = String::from_utf8(total).map_err(|e| RemoteError::Custom(Box::new(e)))?;
			let res = serde_json::from_str::<BatchResponse>(&res).map_err(|e| RemoteError::Custom(Box::new(e)))?;

			Ok(res)
		}

		async fn download(&self, action: &ObjectAction, to: &mut Write) -> Result<Pointer, RemoteError> {
			const BUF_SIZE: usize = 1024 * 1024;

			let url_cstr = std::ffi::CString::from_str(&action.href).unwrap();

			let access_token_cstr = std::ffi::CString::new(self.access_token.as_deref().unwrap_or("")).unwrap();
			let method_cstr = std::ffi::CString::new("GET").unwrap();

			let conn_id = unsafe { em_lfs_http_init(url_cstr.as_ptr(), BUF_SIZE, method_cstr.as_ptr(), access_token_cstr.as_ptr()) } as i32;

			if conn_id <= 0 {
				let err = std::io::Error::other("failed to initialize http connection");
				return Err(RemoteError::Custom(Box::new(err)));
			}

			for (header, value) in action.header.iter() {
				let header_cstr = std::ffi::CString::from_str(header).unwrap();
				let value_cstr = std::ffi::CString::from_str(value).unwrap();
				unsafe { em_lfs_http_set_header(conn_id, header_cstr.as_ptr(), value_cstr.as_ptr()) };
			}

			unsafe {
				em_lfs_http_set_header(
					conn_id,
					std::ffi::CString::new("User-Agent").unwrap().as_ptr(),
					std::ffi::CString::new(USER_AGENT).unwrap().as_ptr(),
				)
			};

			unsafe { em_lfs_http_send(conn_id, std::ptr::null(), 0) };
			handle_http_error(conn_id)?;

			let mut buf = [0u8; BUF_SIZE];
			let mut size = 0;
			let mut read = unsafe { em_http_read(conn_id, buf.as_mut_ptr(), buf.len()) };

			let mut checksum = Sha256::new();

			while read > 0 {
				size += read;
				checksum.update(&buf[..read as usize]);
				to.write(&buf[..read as usize]).map_err(|e| RemoteError::Io(std::io::Error::other(e)))?;
				read = unsafe { em_http_read(conn_id, buf.as_mut_ptr(), buf.len()) };
				handle_http_error(read)?;
			}

			let checksum = checksum.finalize();

			self.free_current_conn();

			Ok(Pointer::from_parts(&checksum, size as usize))
		}

		async fn upload(&self, action: &ObjectAction, blob: &[u8]) -> Result<(), RemoteError> {
			const BUF_SIZE: usize = 1024;

			let url_cstr = std::ffi::CString::from_str(&action.href).unwrap();
			let access_token_cstr = std::ffi::CString::new(self.access_token.as_deref().unwrap_or("")).unwrap();
			let method_cstr = std::ffi::CString::new("PUT").unwrap();

			let conn_id = unsafe { em_lfs_http_init(url_cstr.as_ptr(), BUF_SIZE, method_cstr.as_ptr(), access_token_cstr.as_ptr()) };

			if conn_id <= 0 {
				let err = std::io::Error::other("failed to initialize http connection");
				return Err(RemoteError::Custom(Box::new(err)));
			}

			*self.active_conn_id.lock().unwrap() = conn_id;

			for (header, value) in action.header.iter() {
				let header_cstr = std::ffi::CString::from_str(header).unwrap();
				let value_cstr = std::ffi::CString::from_str(value).unwrap();
				unsafe { em_lfs_http_set_header(conn_id, header_cstr.as_ptr(), value_cstr.as_ptr()) };
			}

			unsafe {
				em_lfs_http_set_header(
					conn_id,
					std::ffi::CString::new("User-Agent").unwrap().as_ptr(),
					std::ffi::CString::new(USER_AGENT).unwrap().as_ptr(),
				)
			};

			let res = unsafe { em_lfs_http_send(conn_id, blob.as_ptr().cast(), blob.len()) };
			handle_http_error(res)?;

			self.free_current_conn();

			Ok(())
		}

		async fn verify(&self, action: &ObjectAction, pointer: &Pointer) -> Result<(), RemoteError> {
			const BUF_SIZE: usize = 1024;

			let url_cstr = std::ffi::CString::from_str(&action.href).unwrap();
			let access_token_cstr = std::ffi::CString::new(self.access_token.as_deref().unwrap_or("")).unwrap();
			let method_cstr = std::ffi::CString::new("POST").unwrap();

			let conn_id = unsafe { em_lfs_http_init(url_cstr.as_ptr(), BUF_SIZE, method_cstr.as_ptr(), access_token_cstr.as_ptr()) };

			if conn_id <= 0 {
				let err = std::io::Error::other("failed to initialize http connection");
				return Err(RemoteError::Custom(Box::new(err)));
			}

			*self.active_conn_id.lock().unwrap() = conn_id;

			for (header, value) in action.header.iter() {
				let header_cstr = std::ffi::CString::from_str(header).unwrap();
				let value_cstr = std::ffi::CString::from_str(value).unwrap();
				unsafe { em_lfs_http_set_header(conn_id, header_cstr.as_ptr(), value_cstr.as_ptr()) };
			}

			unsafe {
				em_lfs_http_set_header(
					conn_id,
					std::ffi::CString::new("User-Agent").unwrap().as_ptr(),
					std::ffi::CString::new(USER_AGENT).unwrap().as_ptr(),
				)
			};

			let body = serde_json::to_string(&BatchObject {
				oid: pointer.hex(),
				size: pointer.size() as u64,
			})
			.map_err(|e| RemoteError::Custom(Box::new(e)))?;
			let body_cstr = std::ffi::CString::new(body.as_str()).unwrap();

			let res = unsafe { em_lfs_http_send(conn_id, body_cstr.as_ptr(), 0) };
			handle_http_error(res)?;

			self.free_current_conn();

			Ok(())
		}
	}

	fn handle_http_error(res: i32) -> Result<(), RemoteError> {
		if res == -403 || res == -401 {
			return Err(RemoteError::AccessDenied);
		}

		if res == -404 {
			return Err(RemoteError::NotFound);
		}

		if res < 0 {
			let err = std::io::Error::other(format!("failed to send http request: {}", res));
			return Err(RemoteError::Custom(Box::new(err)));
		}

		Ok(())
	}

	pub fn pull(
		repo: &git2::Repository,
		url: Url,
		access_token: Option<String>,
		missing: &[Pointer],
		callback: OnProgress,
		_cancel: CancelToken,
	) -> crate::Result<()> {
		let client = WasmLfsClient::new(url, access_token);
		let lfs_remote = LfsClient::new(repo, client)
			.concurrency_limit(super::CONCURRENCY_LIMIT)
			.on_progress(callback);

		futures::executor::block_on(lfs_remote.pull(missing)).map_err(git2_lfs::Error::from)?;

		Ok(())
	}

	pub fn push(
		repo: &git2::Repository,
		url: Url,
		access_token: Option<String>,
		objects: &[Pointer],
		callback: OnProgress,
		_cancel: CancelToken,
	) -> crate::Result<()> {
		let client = WasmLfsClient::new(url, access_token);
		let lfs_remote = LfsClient::new(repo, client)
			.concurrency_limit(super::CONCURRENCY_LIMIT)
			.on_progress(callback);

		futures::executor::block_on(lfs_remote.push(objects)).map_err(git2_lfs::Error::from)?;

		Ok(())
	}
}
