#!/bin/bash

source "$(dirname "$0")"/init.sh

if [[ "$1" != "--container" ]]; then
    cd bundle/setup
fi

sign_macos_arm() {
    macos_notary "$APP_NAME""$VERSION_ARM64".dmg
}

sign_macos_intel() {
    macos_notary "$APP_NAME""$VERSION_X64".dmg
}

sign_android() {
    echo "$TAURI_ANDROID_SIGNING_PASSWORD" | "$ANDROID_HOME"/build-tools/34.0.0/apksigner sign --ks ../../android.keystore --ks-key-alias com.ics.gramax --in "$ANDROID_FILENAME".apk
    "$ANDROID_HOME"/build-tools/34.0.0/apksigner verify -v "$ANDROID_FILENAME".apk
}

sign_win() {
    if [[ -n ${KMS_AWS_KEY_ID+x} && -n ${KMS_AWS_ACCESS_KEY_ID+x} && -n ${KMS_AWS_SECRET_ACCESS_KEY+x} && -n ${CODE_SIGNING_CERT+x} ]]; then
        echo Signing app
        jsign --alias "${KMS_AWS_KEY_ID}" --storepass "${KMS_AWS_ACCESS_KEY_ID}|${KMS_AWS_SECRET_ACCESS_KEY}" --keystore eu-north-1 --storetype AWS --certfile "${CODE_SIGNING_CERT}" --tsaurl http://timestamp.digicert.com $1
        echo Signed app
    else
        echo "KMS_AWS_KEY_ID, KMS_AWS_ACCESS_KEY_ID, KMS_AWS_SECRET_ACCESS_KEY, CODE_SIGNING_CERT are not set. Skip signing.."
    fi
}

sign_containers() {
    if [[ -n "${KMS_AWS_KEY_ARN}" ]]; then # -n "${NEED_TO_SIGN}" &&
        echo "Signing container"
        digest=$(jq -r '."containerimage.digest"' ../../build-metadata.json)
        
        if [[ -z "${digest}"  || "${digest}" == "null"  ]]; then
            echo "Failed to extract image digest. Exiting."
            exit 1
        fi
        
        echo "Signing the image ${CI_REGISTRY}/${CI_PROJECT_PATH}:${SERVICE_NAME}-${BRANCH}@${digest} with cosign..."
        AWS_SECRET_ACCESS_KEY=${KMS_AWS_SECRET_ACCESS_KEY} AWS_ACCESS_KEY_ID=${KMS_AWS_ACCESS_KEY_ID} AWS_DEFAULT_REGION=${KMS_AWS_DEFAULT_REGION} cosign sign -y --key "awskms:///${KMS_AWS_KEY_ARN}" "$CI_REGISTRY/$CI_PROJECT_PATH:$SERVICE_NAME-$BRANCH@$digest" | jq
    else
        if [[ -z "${NEED_TO_SIGN}" ]]; then
            echo "Skipping container signing because NEED_TO_SIGN is not set or false."
        else
            echo "Skipping container signing because KMS_AWS_KEY_ARN is not set."
        fi
    fi
}

for arg in "$@"; do
    case "$arg" in
        "--macos") sign_macos_arm ;;
        "--macos-intel") sign_macos_intel ;;
        "--win") sign_win "$2" ;;
        "--android") sign_android ;;
        "--container") sign_containers;;
    esac
done
