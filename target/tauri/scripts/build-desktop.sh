#!/bin/bash

source "$(dirname "$0")"/init.sh

mkdir -p bundle
mkdir -p bundle/setup

rm -r bundle/signatures 2> /dev/null
rm -r bundle/Gramax* 2> /dev/null
rm -r bundle/setup/* 2> /dev/null

mkdir -p bundle/setup/releases


echo Building..

if [[ -n ${S3_ENV_FOLDER+x} ]]; then
  echo "Will check updates at $S3_ENV_FOLDER"
	UPDATER_CONFIG=",
    \"plugins\": {
      \"updater\": {
        \"endpoints\": [\"https://s3.ics-it.ru/public/docreader/$S3_ENV_FOLDER/updates.json\"]
      }
    }"
else
  echo "S3_ENV_FOLDER is not set. Update checking is disabled"
  UPDATER_CONFIG=""
fi

set -euo pipefail

{
  echo Building windows x86_64;
  
  WIN_PATH=target/x86_64-pc-windows-msvc/release

  # Два вызова cargo tauri build с разными --runner это костыль, потому что по отдельности первый жалуется на zstd, а второй на */U*sers/.. в пути
  set +euo pipefail
  cargo tauri build --ci --target x86_64-pc-windows-msvc -c "{ \"package\": { \"version\": \"$VERSION_WIN\" } $UPDATER_CONFIG }"
  set -euo pipefail
  cargo tauri build --ci --target x86_64-pc-windows-msvc -c "{ \"package\": { \"version\": \"$VERSION_WIN\" } $UPDATER_CONFIG }" --runner cargo-xwin

  tar -czcf ./bundle/"$WIN_FILENAME".exe.tar.gz -C $WIN_PATH Gramax.exe # просто экзешник

  cp "$WIN_PATH"/bundle/nsis/"$WIN_FILENAME"_x64-setup.nsis.zip.sig ./bundle/setup/releases/"$VERSION_WIN".sig # сигнатура
  cp "$WIN_PATH"/bundle/nsis/"$WIN_FILENAME"_x64-setup.nsis.zip ./bundle/setup/releases/"$WIN_FILENAME"-setup.nsis.zip # установщик для обновлений

  cp "$WIN_PATH"/bundle/nsis/Gramax_"$VERSION_WIN"_x64-setup.exe ./bundle/setup/"$WIN_FILENAME".setup.exe # установщик
  signexe ./bundle/setup/"$WIN_FILENAME".setup.exe

  echo "Building windows done";
};

{
  echo Building macos x86_64;

  MACOS_PATH=target/x86_64-apple-darwin/release/bundle/macos
  DMG_PATH=target/x86_64-apple-darwin/release/bundle/dmg

  cargo tauri build --ci --target x86_64-apple-darwin -c "{ \"package\": { \"version\": \"$VERSION_X64\" } $UPDATER_CONFIG, \"tauri\": { \"bundle\": { \"resources\": [\"docs/*\"]  } } }"
  notary $DMG_PATH/Gramax_"$VERSION_X64"_x64.dmg
  tar -czcf ./bundle/"$X64_FILENAME".app.tar.gz -C $MACOS_PATH Gramax.app
  cp $DMG_PATH/Gramax_"$VERSION_X64"_x64.dmg ./bundle/setup/"$X64_FILENAME".dmg

  cp "$MACOS_PATH/Gramax.app.tar.gz.sig" ./bundle/setup/releases/"$VERSION_X64".sig
  cp "$MACOS_PATH/Gramax.app.tar.gz" ./bundle/setup/releases/"$X64_FILENAME".app.tar.gz

  echo "Building x86_64 done";
};

{
  echo Building macos aarch64;

  MACOS_PATH=target/aarch64-apple-darwin/release/bundle/macos
  DMG_PATH=target/aarch64-apple-darwin/release/bundle/dmg
  
  cargo tauri build --ci --target aarch64-apple-darwin -c "{ \"package\": { \"version\": \"$VERSION_ARM64\" } $UPDATER_CONFIG, \"tauri\": { \"bundle\": { \"resources\": [\"docs/*\"] } } }"
  notary $DMG_PATH/Gramax_"$VERSION_ARM64"_aarch64.dmg
  tar -czcf ./bundle/"$ARM64_FILENAME".app.tar.gz -C $MACOS_PATH Gramax.app;
  cp $DMG_PATH/Gramax_"$VERSION_ARM64"_aarch64.dmg ./bundle/setup/"$ARM64_FILENAME".dmg

  cp "$MACOS_PATH/Gramax.app.tar.gz.sig" ./bundle/setup/releases/"$VERSION_ARM64".sig
  cp "$MACOS_PATH/Gramax.app.tar.gz" ./bundle/setup/releases/"$ARM64_FILENAME".app.tar.gz

  echo "Building aarh64 done";
};

ls bundle/setup