use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FsEvent {
	pub rel_path: String,
	pub kind: FsEventKind,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum FsEventKind {
	Created,
	Modified,
	Removed,
	Renamed { from: String },
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchOpts {
	#[serde(default = "default_excludes")]
	pub excludes: Vec<String>,
	#[serde(default = "default_debounce")]
	pub debounce_ms: u64,
}

fn default_excludes() -> Vec<String> {
	vec![".git".to_string(), "node_modules".to_string(), ".DS_Store".to_string()]
}

fn default_debounce() -> u64 {
	300
}

impl Default for WatchOpts {
	fn default() -> Self {
		Self { excludes: default_excludes(), debounce_ms: default_debounce() }
	}
}
