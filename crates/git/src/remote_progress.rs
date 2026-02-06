use git2::*;
use std::fmt::Display;
use std::rc::Rc;
use std::time::Duration;

use crate::cancel_token::CancelToken;
use crate::creds::ActualCreds;
use crate::remote_callback::CreateRemoteCallbacks;
use crate::repo::Repo;
use crate::time_now;

pub type RemoteProgressCallback<'c> = Rc<dyn Fn(RemoteProgress) + 'c>;

pub(super) const CHUNK_TIME_SPAN: Duration = Duration::from_secs(1);

pub trait CreateRemoteTransferCallbacks<'c> {
	fn create_remote_transfer_callbacks(&'c self, cancel_token: CancelToken<'c>, on_progress: RemoteProgressCallback<'c>) -> RemoteCallbacks<'c>;
}

#[derive(serde::Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "type", content = "data")]
pub enum TransferProgress {
	IndexingDeltas { indexed: usize, total: usize },
	ReceivingObjects { received: usize, indexed: usize, total: usize },
}

#[derive(serde::Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "type", content = "data")]
pub enum RemoteProgress {
	Sideband {
		id: usize,
		remote_text: String,
	},
	#[serde(rename_all = "camelCase")]
	ChunkedTransfer {
		id: usize,
		transfer: TransferProgress,
		bytes: usize,
		download_speed_bytes: usize,
	},
	Checkout {
		id: usize,
		checkouted: usize,
		total: usize,
	},
	Finish {
		id: usize,
		is_cancelled: bool,
	},
	#[serde(rename_all = "camelCase")]
	Lfs {
		id: usize,
		is_cancelled: bool,
		download_speed_bytes: usize,
		#[serde(flatten)]
		data: git2_lfs::remote::Progress,
	},
}

impl<'c, C: ActualCreds> CreateRemoteTransferCallbacks<'c> for C {
	fn create_remote_transfer_callbacks(&'c self, cancel_token: CancelToken<'c>, on_progress: RemoteProgressCallback<'c>) -> RemoteCallbacks<'c> {
		let mut last_transfer_bytes = 0;
		let mut last_transfer_callback = time_now() - CHUNK_TIME_SPAN;

		let mut cbs = self.create_remote_callbacks();

		let on_sideband_progress = on_progress.clone();
		let sideband_cancel_token = cancel_token.clone();

		cbs.sideband_progress(move |sideband| {
			let on_progress = on_sideband_progress.as_ref();
			let Some(sideband) = RemoteProgress::sideband(sideband_cancel_token.id(), sideband) else {
				return true;
			};

			on_progress(sideband);
			!sideband_cancel_token.is_cancelled()
		});

		let on_transfer_progress = on_progress;
		let transfer_cancel_token = cancel_token;
		cbs.transfer_progress(move |progress| {
			if time_now() - last_transfer_callback < CHUNK_TIME_SPAN {
				return true;
			}

			let on_progress = on_transfer_progress.as_ref();

			last_transfer_callback = time_now();
			let received_bytes = progress.received_bytes();

			on_progress(RemoteProgress::transfer_progress(
				transfer_cancel_token.id(),
				progress,
				last_transfer_bytes,
			));

			last_transfer_bytes = received_bytes;

			!transfer_cancel_token.is_cancelled()
		});

		cbs
	}
}

impl<'c, C: ActualCreds> CreateRemoteTransferCallbacks<'c> for Repo<'c, C> {
	fn create_remote_transfer_callbacks(&'c self, cancel_token: CancelToken<'c>, on_progress: RemoteProgressCallback<'c>) -> RemoteCallbacks<'c> {
		self.1.create_remote_transfer_callbacks(cancel_token, on_progress)
	}
}

impl RemoteProgress {
	pub fn sideband(id: usize, remote_text: &[u8]) -> Option<Self> {
		let remote_text = String::from_utf8_lossy(remote_text).trim().to_string();
		if remote_text.is_empty() {
			return None;
		}
		Some(Self::Sideband { id, remote_text })
	}

	pub fn transfer_progress(id: usize, progress: Progress, last_transfer_bytes: usize) -> Self {
		let transfer = if progress.total_objects() == progress.received_objects() {
			TransferProgress::IndexingDeltas {
				indexed: progress.indexed_deltas(),
				total: progress.total_deltas(),
			}
		} else {
			TransferProgress::ReceivingObjects {
				received: progress.received_objects(),
				indexed: progress.indexed_objects(),
				total: progress.total_objects(),
			}
		};

		Self::ChunkedTransfer {
			id,
			transfer,
			bytes: progress.received_bytes(),
			download_speed_bytes: (progress.received_bytes() - last_transfer_bytes) / CHUNK_TIME_SPAN.as_secs() as usize,
		}
	}

	pub fn checkout_progress(id: usize, checkedout: usize, total: usize) -> Self {
		Self::Checkout {
			id,
			checkouted: checkedout,
			total,
		}
	}
}

impl Display for RemoteProgress {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		match self {
			RemoteProgress::Sideband { remote_text, .. } => write!(f, "remote -> {remote_text}"),
			RemoteProgress::ChunkedTransfer {
				transfer,
				bytes,
				download_speed_bytes,
				..
			} => {
				match transfer {
					TransferProgress::ReceivingObjects { received, indexed, total } => {
						write!(f, "receiving objects -> received: {received}, indexed: {indexed}, total: {total}")
					}
					TransferProgress::IndexingDeltas { indexed, total } => {
						write!(f, "indexing deltas -> indexed: {indexed}, total: {total}")
					}
				}?;
				write!(
					f,
					", {:.3}mb {:.3}mb/s",
					*bytes as f64 / 1024.0 / 1024.0,
					*download_speed_bytes as f64 / 1024.0 / 1024.0
				)
			}
			RemoteProgress::Checkout { checkouted, total, .. } => {
				write!(f, "checkout progress -> checked out: {checkouted}, total: {total}")
			}
			RemoteProgress::Lfs { data, .. } => {
				use git2_lfs::remote::Progress;
				use git2_lfs::remote::ProgressEvent;

				match data {
					Progress::Download(ProgressEvent {
						total_objects,
						total_bytes,
						bytes_handled,
						objects_handled,
						next_object_size,
					}) => {
						write!(
							f,
							"lfs:download -> objects: {objects_handled}/{total_objects} ({bytes_handled}/{total_bytes}b), next: {next_object_size}b"
						)
					}
					Progress::Upload(ProgressEvent {
						total_objects,
						total_bytes,
						bytes_handled,
						objects_handled,
						next_object_size,
					}) => {
						write!(
							f,
							"lfs:upload -> objects: {objects_handled}/{total_objects} ({bytes_handled}/{total_bytes}b), next: {next_object_size}b"
						)
					}
					Progress::Verify(ProgressEvent {
						total_objects,
						total_bytes,
						bytes_handled,
						objects_handled,
						next_object_size,
					}) => {
						write!(
							f,
							"lfs:verify -> objects: {objects_handled}/{total_objects} ({bytes_handled}/{total_bytes}b), next: {next_object_size}b"
						)
					}
				}
			}
			RemoteProgress::Finish { is_cancelled, .. } => {
				write!(f, "finish -> is_cancelled: {is_cancelled}")
			}
		}
	}
}
