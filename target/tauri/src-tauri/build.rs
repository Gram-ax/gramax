fn main() {
  if std::env::var("CARGO_CFG_TARGET_OS").unwrap() == "ios" {
    println!("cargo:rustc-env=ENTERPRISE_SERVER_URL=https://app.gram.ax/-server");
  }

  tauri_build::build();
}
