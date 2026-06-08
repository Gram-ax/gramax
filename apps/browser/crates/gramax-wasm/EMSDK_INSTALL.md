# Emscripten official docs
See: https://emscripten.org/docs/getting_started/downloads.html

# TL;DR

## Install rust

1. Install rustup: https://rustup.rs/
2. Install Rust toolchain: 
```sh
rustup toolchain install stable
rustup toolchain install nightly
rustup +nightly target add wasm32-unknown-unknown
rustup +nightly component add rust-src
```
3. Verify installation: `rustup show` should show you the installed toolchains and targets, and `rustc --version` should confirm that Rust is installed correctly.

## Install emsdk

At the moment of writing, the latest version of emsdk is `5.0.6`

1. Clone emsdk: `git clone https://github.com/emscripten-core/emsdk.git --depth 1 --recursive`
2. Install and activate latest SDK: `./emsdk install latest && ./emsdk activate latest`
3. Add to PATH: `source ./emsdk_env.sh` or see emsdk's package manager hint of how to do it permanently for your shell
4. Verify installation: `emcc -v`
5. Warm up zlib cache: `touch x.c && emcc -sUSE_ZLIB=1 x.c && rm a.* && rm x.c`

## Compile the wasm module

Use: `bun run build:wasm`
