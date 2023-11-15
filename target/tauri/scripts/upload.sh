#!/bin/bash

source "$(dirname "$0")"/init.sh

set +euo pipefail

JSON="{
  \"current\": \"$BUILD_DATE.$VERSION_COMMIT_COUNT\",
  \"win\": \"$WIN_FILENAME.setup.exe\",
  \"mac-intel\": \"$X64_FILENAME.dmg\",
  \"mac-silicon\": \"$ARM64_FILENAME.dmg\",
  \"android\": \"$ANDROID_FILENAME.apk\",
  \"ios\": \"$IOS_FILENAME.ipa\"
}"

UPDATE_URL="$S3_HOST"/public/docreader/"$S3_ENV_FOLDER"/releases

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
      \"url\": \"$UPDATE_URL/$WIN_FILENAME-setup.nsis.zip\"
    }
  }
}"

echo "$UPDATE"
echo "$JSON"

echo "$UPDATE" > ./bundle/setup/updates.json
echo "$JSON" > ./bundle/setup/versions.json

mc alias set s3 "${S3_HOST}" "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}"
mc mirror --overwrite --remove --md5 "bundle/setup" "s3/public/docreader/${S3_ENV_FOLDER}"