use std::path::Path;
use std::process::Command;

fn main() {
	println!("cargo:rerun-if-changed=static_env_gen.js");

	let out_dir = &std::env::var("OUT_DIR").unwrap();
	let out_dir = Path::new(out_dir);

	_ = std::fs::create_dir_all(out_dir);

	Command::new("bun")
		.arg("build")
		.arg("./static_env_gen.js")
		.arg("--target")
		.arg("bun")
		.arg("--outfile")
		.arg(out_dir.join("static_env.js"))
		.status()
		.expect("failed to build static_env.js");
}
