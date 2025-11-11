#!/bin/bash

source "$(dirname "$0")"/init.sh

set +euo pipefail

JSON="{
  \"current\": \"$BUILD_DATE.$VERSION_COMMIT_COUNT\",
  \"win\": \"$WIN_FILENAME.setup.exe\",
  \"mac-intel\": \"$X64_FILENAME.dmg\",
  \"mac-silicon\": \"$ARM64_FILENAME.dmg\",
  \"linux\": \"$LINUX_FILENAME.AppImage\",
  \"android\": \"$ANDROID_FILENAME.apk\",
  \"ios\": \"$IOS_FILENAME.ipa\"
}"

UPDATE_URL="${S3_BUCKET_HOST}/${S3_ENV_FOLDER}/releases"
INSTALLER_URL="${S3_BUCKET_HOST}/${S3_ENV_FOLDER}"

UPDATE="{
  \"version\": \"$BUILD_DATE-$VERSION_COMMIT_COUNT\",
  \"pub_date\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
  \"platforms\": {
    \"darwin-aarch64\": {
      \"signature\": \"$(cat ./bundle/setup/releases/"$VERSION_ARM64".sig)\",
      \"url\": \"$UPDATE_URL/$ARM64_FILENAME.app.tar.gz\"
    },
    \"darwin-x86_64\": {
      \"signature\": \"$(cat ./bundle/setup/releases/"$VERSION_X64".sig)\",
      \"url\": \"$UPDATE_URL/$X64_FILENAME.app.tar.gz\"
    },
    \"windows-x86_64\": {
      \"signature\": \"$(cat ./bundle/setup/releases/"$VERSION_WIN".sig)\",
      \"url\": \"$UPDATE_URL/$WIN_FILENAME.setup.exe\"
    },
    \"linux-x86_64\": {
      \"signature\": \"$(cat ./bundle/setup/releases/"$VERSION_LINUX".sig)\",
      \"url\": \"$UPDATE_URL/$LINUX_FILENAME.tar.gz\"
    }
  }
}"

X_UPDATE="{
  \"version\": \"$BUILD_DATE-$VERSION_COMMIT_COUNT\",
  \"pub_date\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
  \"platforms\": {
    \"darwin-aarch64\": {
      \"signature\": \"$(cat ./bundle/setup/releases/"$VERSION_ARM64".sig)\",
      \"url\": \"$UPDATE_URL/$ARM64_FILENAME.app.tar.gz\",
      \"url_installer\": \"$INSTALLER_URL/$ARM64_FILENAME.dmg\"
    },
    \"darwin-x86_64\": {
      \"signature\": \"$(cat ./bundle/setup/releases/"$VERSION_X64".sig)\",
      \"url\": \"$UPDATE_URL/$X64_FILENAME.app.tar.gz\",
      \"url_installer\": \"$INSTALLER_URL/$X64_FILENAME.dmg\"
    },
    \"windows-x86_64\": {
      \"signature\": \"$(cat ./bundle/setup/releases/"$VERSION_WIN".sig)\",
      \"url\": \"$UPDATE_URL/$WIN_FILENAME.setup.exe\",
      \"url_installer\": \"$INSTALLER_URL/$WIN_FILENAME.setup.exe\"
    },
    \"linux-x86_64\": {
      \"signature\": \"$(cat ./bundle/setup/releases/"$VERSION_LINUX".appimage.sig)\",
      \"url\": \"$UPDATE_URL/$LINUX_FILENAME.tar.gz\",
      \"url_installer\": \"$INSTALLER_URL/$LINUX_FILENAME.AppImage\"
    }
  }
}"

echo "$UPDATE"
echo "$JSON"

echo "$UPDATE" > ./bundle/setup/updates.json
echo "$X_UPDATE" > ./bundle/setup/x-updates.json
echo "$JSON" > ./bundle/setup/versions.json
 
ls bundle/setup
ls bundle/setup/releases

mc alias set s3 "${S3_HOST}" "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}"
mc mirror --overwrite --remove --md5 "bundle/setup" "s3/public/docreader/${S3_ENV_FOLDER}"
