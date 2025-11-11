#!/bin/bash

export PATH=$PATH:"$(realpath .)/.ci/apps"
echo $PATH
source "$(dirname "$0")"/init.sh

# mkdir -p bundle
# mkdir -p bundle/setup

# rm -r bundle/signatures 2> /dev/null
# rm -r bundle/Gramax* 2> /dev/null
# rm -r bundle/setup/* 2> /dev/null

mkdir -p bundle/setup/releases

if [[ "$PROFILE" == "development" ]]; then
  echo "Using development profile, build performance will be not optimal"
fi

echo Building..

if [[ -n ${UPDATER_CHANNEL+x} ]]; then
  echo "Will check updates at $UPDATER_CHANNEL"

  if [[ "$BRANCH" == "develop" ]]; then
    UPDATER_URL="https://develop.gram.ax/apps/updates?channel=$UPDATER_CHANNEL"
  else
    UPDATER_URL="https://gram.ax/apps/updates?channel=$UPDATER_CHANNEL"
  fi

	UPDATER_CONFIG=",
    \"plugins\": {
      \"updater\": {
        \"endpoints\": [\"$UPDATER_URL\"]
      }
    }"
else
  echo "UPDATER_CHANNEL is not set. Update checking is disabled"
  UPDATER_CONFIG=""
fi

set -euo pipefail

build_macos_arm() {
  echo Building macos aarch64;

  MACOS_PATH=$CI_PROJECT_DIR/target/aarch64-apple-darwin/$PROFILE/bundle/macos
  DMG_PATH=$CI_PROJECT_DIR/target/aarch64-apple-darwin/$PROFILE/bundle/dmg
  
  cargo tauri build --ci --target aarch64-apple-darwin -c "{ \"productName\": \"$PRODUCT_NAME\", \"identifier\": \"$PRODUCT_ID\", \"version\": \"$VERSION_ARM64\", \"build\": { \"beforeBuildCommand\": \"echo Building...\" } $UPDATER_CONFIG }" -- $PROFILE_FLAGS
  tar -czcf ./bundle/"$ARM64_FILENAME".app.tar.gz -C "$MACOS_PATH" "$PRODUCT_NAME.app";
  cp "${DMG_PATH}/${PRODUCT_NAME}_${VERSION_ARM64}_aarch64.dmg" ./bundle/setup/"$ARM64_FILENAME".dmg

  cp "${MACOS_PATH}/${PRODUCT_NAME}.app.tar.gz.sig" ./bundle/setup/releases/"$VERSION_ARM64".sig
  cp "${MACOS_PATH}/${PRODUCT_NAME}.app.tar.gz" ./bundle/setup/releases/"$ARM64_FILENAME".app.tar.gz
}

build_macos_intel() {
  echo Building macos x86_64;

  MACOS_PATH=$CI_PROJECT_DIR/target/x86_64-apple-darwin/release/bundle/macos
  DMG_PATH=$CI_PROJECT_DIR/target/x86_64-apple-darwin/release/bundle/dmg

  cargo tauri build --ci --target x86_64-apple-darwin -c "{ \"productName\": \"$PRODUCT_NAME\", \"identifier\": \"$PRODUCT_ID\", \"version\": \"$VERSION_X64\", \"build\": { \"beforeBuildCommand\": \"echo Building...\" } $UPDATER_CONFIG  }"
  tar -czcf ./bundle/"$X64_FILENAME".app.tar.gz -C "$MACOS_PATH" "$PRODUCT_NAME.app"
  cp "${DMG_PATH}/${PRODUCT_NAME}_${VERSION_X64}_x64.dmg" ./bundle/setup/"$X64_FILENAME".dmg

  cp "$MACOS_PATH/${PRODUCT_NAME}.app.tar.gz.sig" ./bundle/setup/releases/"$VERSION_X64".sig
  cp "${MACOS_PATH}/${PRODUCT_NAME}.app.tar.gz" ./bundle/setup/releases/"$X64_FILENAME".app.tar.gz
}

build_win() {
  echo Building windows

  WIN_PATH=$CI_PROJECT_DIR/target/x86_64-pc-windows-msvc/$PROFILE

  cargo tauri build --ci --target x86_64-pc-windows-msvc -c "{ \"productName\": \"$PRODUCT_NAME\", \"identifier\": \"$PRODUCT_ID\", \"version\": \"$VERSION_WIN\", \"build\": { \"beforeBuildCommand\": \"echo Building...\" } $UPDATER_CONFIG }" --runner cargo-xwin -- $PROFILE_FLAGS

  tar -czcf ./bundle/"$WIN_FILENAME".exe.tar.gz -C "$WIN_PATH" "gramax.exe" # just the executable

  cp "$WIN_PATH/bundle/nsis/${PRODUCT_NAME}_${VERSION_WIN}_x64-setup.exe.sig" ./bundle/setup/releases/"$VERSION_WIN".sig # signature
  cp "$WIN_PATH/bundle/nsis/${PRODUCT_NAME}_${VERSION_WIN}_x64-setup.exe" "./bundle/setup/releases/${WIN_FILENAME}.setup.exe" # installer for updates

  cp "$WIN_PATH/bundle/nsis/${PRODUCT_NAME}_${VERSION_WIN}_x64-setup.exe" ./bundle/setup/"$WIN_FILENAME".setup.exe # installer
}

build_linux() {
  echo Building linux

  cargo tauri build --ci --target x86_64-unknown-linux-gnu -c "{ \"productName\": \"$PRODUCT_NAME\", \"identifier\": \"$PRODUCT_ID\", \"version\": \"$VERSION_LINUX\", \"build\": { \"beforeBuildCommand\": \"echo Building...\" } $UPDATER_CONFIG }"

  TARGET_PATH=target/x86_64-unknown-linux-gnu/release/bundle
  linux_cp_appimage $TARGET_PATH
  linux_cp_deb $TARGET_PATH
  linux_cp_rpm $TARGET_PATH
}

linux_cp_appimage() {
  APPIMAGE_OUT_PATH=$CI_PROJECT_DIR/$1/appimage
  cp "$APPIMAGE_OUT_PATH"/"$PRODUCT_NAME"_"$VERSION_LINUX"_amd64.AppImage ./bundle/setup/releases/"$LINUX_FILENAME".tar.gz
  cp "$APPIMAGE_OUT_PATH"/"$PRODUCT_NAME"_"$VERSION_LINUX"_amd64.AppImage.sig ./bundle/setup/releases/"$VERSION_LINUX".appimage.sig
  cp "$APPIMAGE_OUT_PATH"/"$PRODUCT_NAME"_"$VERSION_LINUX"_amd64.AppImage ./bundle/setup/"$LINUX_FILENAME".AppImage
}

linux_cp_deb() {
  DEB_OUT_PATH=$CI_PROJECT_DIR/$1/deb
  cp "$DEB_OUT_PATH"/"$PRODUCT_NAME"_"$VERSION_LINUX"_amd64.deb ./bundle/setup/releases/"$LINUX_FILENAME".deb
  cp "$DEB_OUT_PATH"/"$PRODUCT_NAME"_"$VERSION_LINUX"_amd64.deb.sig ./bundle/setup/releases/"$VERSION_LINUX".deb.sig
  cp "$DEB_OUT_PATH"/"$PRODUCT_NAME"_"$VERSION_LINUX"_amd64.deb ./bundle/setup/"$LINUX_FILENAME".deb
}

linux_cp_rpm() {
  RPM_OUT_PATH=$CI_PROJECT_DIR/$1/rpm
  cp "$RPM_OUT_PATH"/"$PRODUCT_NAME"-"$VERSION_LINUX"-1.x86_64.rpm ./bundle/setup/releases/"$LINUX_FILENAME".rpm
  cp "$RPM_OUT_PATH"/"$PRODUCT_NAME"-"$VERSION_LINUX"-1.x86_64.rpm.sig ./bundle/setup/releases/"$VERSION_LINUX".rpm.sig
  cp "$RPM_OUT_PATH"/"$PRODUCT_NAME"-"$VERSION_LINUX"-1.x86_64.rpm ./bundle/setup/"$LINUX_FILENAME".rpm
}

build_android() {
  echo Building Android
  
  ANDROID_PATH=src-tauri/gen/android/app/build/outputs/apk/universal/release

  cargo tauri android build --apk --target aarch64 -c  "{ \"productName\": \"$PRODUCT_NAME\", \"identifier\": \"$PRODUCT_ID\", \"version\": \"$VERSION_ANDROID\", \"build\": { \"beforeBuildCommand\": \"echo Building...\" } $UPDATER_CONFIG }"
  cp "$ANDROID_PATH"/*.apk ./bundle/setup/"$ANDROID_FILENAME".apk
}

build_ios() {
  echo Building iOS

  IOS_PATH=src-tauri/gen/apple/build/arm64

  mkdir -p src-tauri/gen/apple/Externals/arm64/release
  cargo tauri ios build -c "{ \"productName\": \"$PRODUCT_NAME\", \"identifier\": \"$PRODUCT_ID\", \"version\": \"$VERSION_IOS\", \"build\": { \"beforeBuildCommand\": \"echo Building...\" } }" --build-number "$VERSION_COMMIT_COUNT"

  cp "$IOS_PATH/$PRODUCT_NAME.ipa" ./bundle/setup/"$IOS_FILENAME".ipa
}

for arg in "$@"; do

  case "$arg" in
    "--macos") build_macos_arm ;;
    "--macos-intel") build_macos_intel ;;
    "--win") build_win ;;
    "--linux") build_linux ;;
    "--android") build_android ;;
    "--ios") build_ios ;;
  esac
done
