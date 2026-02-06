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

sign_containers_legacy() {
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


sign_containers() {
    if [[ -z "${KMS_AWS_KEY_ARN}" ]]; then
        echo "Skipping container signing because KMS_AWS_KEY_ARN is not set."
        return 0
    fi

    echo "Preparing container signing"

    TAGS=()

    if [[ "$CI_COMMIT_REF_NAME" == "develop" ]]; then
        TAGS+=("${APP_VERSION}-dev" "latest-dev")
    fi

    if [[ "$CI_COMMIT_REF_NAME" == "master" ]]; then
        TAGS+=("${APP_VERSION}" "latest" "prod")
    fi

    for TAG in "${TAGS[@]}"; do
        IMAGE="${CI_REGISTRY_IMAGE}/${SERVICE_NAME}:${TAG}"

        echo "Processing image: ${IMAGE}"

        DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' "${IMAGE}" 2>/dev/null | cut -d@ -f2)

        if [[ -z "${DIGEST}" ]]; then
            echo "Failed to resolve digest for ${IMAGE}, skipping"
            continue
        fi

        FULL_IMAGE="${CI_REGISTRY_IMAGE}/${SERVICE_NAME}@${DIGEST}"

        if cosign verify --key "awskms:///${KMS_AWS_KEY_ARN}" "${FULL_IMAGE}" >/dev/null 2>&1; then
            echo "Image already signed: ${FULL_IMAGE}"
            continue
        fi

        echo "Signing image: ${FULL_IMAGE}"

        AWS_SECRET_ACCESS_KEY=${KMS_AWS_SECRET_ACCESS_KEY} \
        AWS_ACCESS_KEY_ID=${KMS_AWS_ACCESS_KEY_ID} \
        AWS_DEFAULT_REGION=${KMS_AWS_DEFAULT_REGION} \
        cosign sign -y --key "awskms:///${KMS_AWS_KEY_ARN}" "${FULL_IMAGE}" | jq
    done
}


for arg in "$@"; do
    case "$arg" in
        "--macos") sign_macos_arm ;;
        "--macos-intel") sign_macos_intel ;;
        "--win") sign_win "$2" ;;
        "--android") sign_android ;;
        "--container-legacy") sign_containers_legacy;;
        "--container") sign_containers;;
    esac
done
