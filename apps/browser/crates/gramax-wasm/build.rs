pub fn main() {
  println!("cargo:rerun-if-changed=src/binding.c");

  if std::env::var("CARGO_CFG_TARGET_ARCH").unwrap() == "wasm32" {
    cc::Build::new().file("src/binding.c").compile("em_lfs");
  }
}
