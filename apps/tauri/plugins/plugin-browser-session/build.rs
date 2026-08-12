const COMMANDS: &[&str] = &[
	"get_session_meta",
	"resolve_request",
	"debug_log",
	"ensure_session",
	"navigate",
	"read_page",
	"read_element",
	"click",
	"type",
	"scroll",
	"reveal",
	"teardown",
];

fn main() {
	let sdk_dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("sdk");
	let status = std::process::Command::new("bun")
		.args(["run", "build"])
		.current_dir(&sdk_dir)
		.status()
		.expect("failed to run bun build for browser-session SDK");
	assert!(status.success(), "bun build for browser-session SDK failed");
	println!("cargo:rerun-if-changed=sdk/src");

	tauri_plugin::Builder::new(COMMANDS).build();
}
