use std::collections::HashMap;
use std::num::NonZeroUsize;
use std::sync::LazyLock;
use std::sync::RwLock;

use crate::creds::Creds;
use crate::repo::Repo;

static ACTIVE_CANCEL_TOKENS: LazyLock<RwLock<HashMap<NonZeroUsize, bool>>> = LazyLock::new(|| RwLock::new(HashMap::new()));

pub trait CancelTokenExt {
	fn get_all_ids() -> Vec<NonZeroUsize>;
}

impl<C: Creds> CancelTokenExt for Repo<'_, C> {
	fn get_all_ids() -> Vec<NonZeroUsize> {
		CancelToken::get_all_ids()
	}
}

pub enum CancelToken<'a> {
	Cancel(NonZeroUsize),
	CancelWithCleanup(NonZeroUsize, Box<dyn Fn() + 'a>),
	Cloned(NonZeroUsize),
	NeverCancel,
}

struct CancelTokenVisitor;

impl<'de> serde::de::Visitor<'de> for CancelTokenVisitor {
	type Value = u64;

	fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
		formatter.write_str("u64")
	}

	fn visit_u64<E: serde::de::Error>(self, v: u64) -> std::result::Result<Self::Value, E> {
		Ok(v)
	}
}

impl<'de> serde::Deserialize<'de> for CancelToken<'_> {
	fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
	where
		D: serde::Deserializer<'de>,
	{
		let v = deserializer.deserialize_u64(CancelTokenVisitor)?;
		Ok(CancelToken::new(v as usize))
	}
}

impl std::fmt::Debug for CancelToken<'_> {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		// avoids possible endless recursion when called from self.is_cancelled()
		let cancelled = match self {
			Self::Cancel(id) | Self::CancelWithCleanup(id, _) | Self::Cloned(id) => {
				let cancelled = *ACTIVE_CANCEL_TOKENS.read().unwrap().get(id).unwrap_or(&true);
				cancelled
			}
			Self::NeverCancel => false,
		};

		let label = if cancelled { "cancelled" } else { "not cancelled" };
		match self {
			Self::Cancel(id) => write!(f, "CancelToken({}, {})", id.get(), label),
			Self::CancelWithCleanup(id, _) => write!(f, "CancelToken({}, with cleanup, {})", id.get(), label),
			Self::Cloned(id) => write!(f, "CancelCloned({})", id.get()),
			Self::NeverCancel => write!(f, "CancelToken(NeverCancel, {})", label),
		}
	}
}

impl<'a> Clone for CancelToken<'a> {
	fn clone(&self) -> Self {
		match self {
			Self::Cancel(id) | Self::CancelWithCleanup(id, _) | Self::Cloned(id) => Self::Cloned(*id),
			Self::NeverCancel => Self::NeverCancel,
		}
	}
}

impl From<usize> for CancelToken<'_> {
	fn from(id: usize) -> Self {
		CancelToken::new(id)
	}
}

impl From<CancelToken<'_>> for usize {
	fn from(val: CancelToken<'_>) -> Self {
		val.id()
	}
}

impl<'a> CancelToken<'a> {
	pub fn is_active(id: usize) -> bool {
		match NonZeroUsize::new(id) {
			Some(id) => ACTIVE_CANCEL_TOKENS.read().unwrap().contains_key(&id),
			None => false,
		}
	}

	pub fn new(id: usize) -> Self {
		match NonZeroUsize::new(id) {
			Some(id) => {
				let val = ACTIVE_CANCEL_TOKENS.read().unwrap().get(&id).copied().unwrap_or(false);
				ACTIVE_CANCEL_TOKENS.write().unwrap().insert(id, val);
				Self::Cancel(id)
			}
			None => Self::NeverCancel,
		}
	}

	pub fn new_with_cleanup(id: usize, on_cleanup: Box<dyn Fn() + 'a>) -> Self {
		match NonZeroUsize::new(id) {
			Some(id) => {
				let val = ACTIVE_CANCEL_TOKENS.read().unwrap().get(&id).copied().unwrap_or(false);
				ACTIVE_CANCEL_TOKENS.write().unwrap().insert(id, val);
				Self::CancelWithCleanup(id, on_cleanup)
			}
			None => Self::NeverCancel,
		}
	}

	pub fn id(&self) -> usize {
		match self {
			Self::Cancel(id) | Self::CancelWithCleanup(id, _) | Self::Cloned(id) => id.get(),
			Self::NeverCancel => 0,
		}
	}

	pub fn get_all_ids() -> Vec<NonZeroUsize> {
		ACTIVE_CANCEL_TOKENS.read().unwrap().keys().cloned().collect()
	}

	pub fn is_cancelled(&self) -> bool {
		match self {
			Self::Cancel(id) | Self::CancelWithCleanup(id, _) | Self::Cloned(id) => {
				let cancelled = *ACTIVE_CANCEL_TOKENS.read().unwrap().get(id).unwrap_or(&true);
				cancelled
			}
			Self::NeverCancel => false,
		}
	}

	pub fn cancel(&self) -> bool {
		match self {
			Self::Cancel(id) | Self::CancelWithCleanup(id, _) | Self::Cloned(id) => {
				ACTIVE_CANCEL_TOKENS.write().unwrap().insert(*id, true);
				true
			}
			Self::NeverCancel => false,
		}
	}
}

impl<'a> Drop for CancelToken<'a> {
	fn drop(&mut self) {
		let is_cancelled = self.is_cancelled();

		match self {
			Self::Cancel(id) => {
				ACTIVE_CANCEL_TOKENS.write().unwrap().remove(id);
			}
			Self::CancelWithCleanup(id, on_cleanup) => {
				if is_cancelled {
					on_cleanup();
				}
				ACTIVE_CANCEL_TOKENS.write().unwrap().remove(id);
			}
			_ => (),
		}
	}
}
