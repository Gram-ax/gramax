#![cfg(not(target_family = "wasm"))]
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod win;

fn main() {
  gramax::run()
}
