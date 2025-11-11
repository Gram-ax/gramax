#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/../../apps/tauri/src-tauri" || exit

mkdir -p icons/badges

cargo tauri icon icons/icon.png --output icons --ios-color "#121315"


for i in {1..99}; do
  magick -size 128x128 xc:none -fill "#FF0000" -draw "circle 64,64 64,20" \
    -gravity center -fill white -pointsize 58 -font Arial -annotate 0 "$i" \
    icons/badges/badge_$i.png
done

magick -size 128x128 xc:none -fill "#FF0000" -draw "circle 64,64 64,20" \
  -gravity center -fill white -pointsize 46 -font Arial -annotate 0 "99+" \
  icons/badges/badge_100.png

command -v dot_clean >/dev/null 2>&1 && dot_clean icons/badges/ || echo "dot_clean not found"; 
# shellcheck disable=SC2046
COPYFILE_DISABLE=1 tar -Jcf icons/badges.tar.xz -C icons/badges $(find icons/badges -type f -name "badge_*.png" | sed 's/icons\/badges\///')
# rm -r icons/badges

set +euo pipefail
