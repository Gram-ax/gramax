fn main() {
  println!(
    "cargo:rustc-env=ENTERPRISE_SERVER_URL={}",
    std::env::var("ENTERPRISE_SERVER_URL").unwrap_or_default()
  );

  tauri_build::build();
}
