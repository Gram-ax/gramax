fn main() {
  println!("cargo:rustc-env=AUTH_SERVICE_URL={}", std::env::var("AUTH_SERVICE_URL").unwrap_or_default());
  println!("cargo:rerun-if-changed=../dist");
  println!("cargo:rerun-if-changed=./locales");

  if cfg!(target_os = "windows") {
    println!("cargo:rustc-link-arg=/DEPENDENTLOADFLAG:0x800");
  }

  tauri_build::try_build(tauri_build::Attributes::new().codegen(tauri_build::CodegenContext::new())).unwrap();
}
