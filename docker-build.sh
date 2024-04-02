#!/bin/bash

compile_wasm() {
    docker run -it --rm -v /$(pwd):/app gitlab.ics-it.ru:4567/ics/doc-reader:base-image //bin/bash -c 'cd /app && sed -i "s/\r$//" ./install-deps.sh && ./install-deps.sh --wasm --skip-npm'
}

for arg in "$@"; do
    case "$arg" in
    --wasm)
        compile_wasm
        ;;
    *)
        echo "Error: Unsupported argument $1" >&2
        ;;
    esac
done
