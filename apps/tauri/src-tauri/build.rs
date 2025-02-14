fn main() {
  println!("cargo:rustc-env=AUTH_SERVICE_URL={}", std::env::var("AUTH_SERVICE_URL").unwrap_or_default());
  println!("cargo:rerun-if-changed=../dist");

  tauri_build::try_build(tauri_build::Attributes::new().codegen(tauri_build::CodegenContext::new())).unwrap();
}
