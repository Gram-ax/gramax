fn main() {
  println!(
    "cargo:rustc-env=AUTH_SERVICE_URL={}",
    std::env::var("AUTH_SERVICE_URL").unwrap_or_default()
  );

  tauri_build::build();
}
