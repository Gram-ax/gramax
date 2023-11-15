#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/../src-tauri" || exit

cargo tauri icon icons/icon.png --output icons --ios-color "#121315"

set +euo pipefail
