#![cfg(not(target_family = "wasm"))]
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  gramax::run()
}
