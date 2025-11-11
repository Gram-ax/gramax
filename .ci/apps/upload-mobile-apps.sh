#!/bin/bash

source "$(dirname "$0")"/init.sh

set +euo pipefail

JSON="{
  \"current\": \"$BUILD_DATE.$VERSION_COMMIT_COUNT\",
  \"android\": \"$ANDROID_FILENAME.apk\",
  \"ios\": \"$IOS_FILENAME.ipa\"
}"

X_UPDATE="{
  \"version\": \"$BUILD_DATE-$VERSION_COMMIT_COUNT\",
  \"pub_date\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
  \"platforms\": {
    \"android\": {
      \"signature\": \"$(cat ./bundle/setup/releases/"$VERSION_ANDROID".sig)\",
      \"url\": \"$UPDATE_URL/$ANDROID_FILENAME.apk\",
      \"url_installer\": \"$INSTALLER_URL/$ANDROID_FILENAME.apk\"
    },
    \"ios\": {
      \"signature\": \"$(cat ./bundle/setup/releases/"$VERSION_IOS".sig)\",
      \"url\": \"$UPDATE_URL/$IOS_FILENAME.ipa\",
      \"url_installer\": \"$INSTALLER_URL/$IOS_FILENAME.ipa\"
    },
  }
}"

echo "$JSON"
echo "$X_UPDATE"

echo "$X_UPDATE" > ./bundle/setup/x-updates.json
echo "$JSON" > ./bundle/setup/versions.json
 
ls bundle/setup
ls bundle/setup/releases

mc alias set s3 "${S3_HOST}" "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}"
mc mirror --overwrite --remove --md5 "bundle/setup" "s3/public/docreader/${S3_ENV_FOLDER}"
