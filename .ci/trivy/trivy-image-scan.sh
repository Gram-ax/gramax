#!/bin/bash


cd "$(dirname "$0")"/../.. || exit 9

if [[ ! -z ${NO_TRIVY} ]]; then
	echo "skipping trivy scan"
	exit 0
fi

set -euo pipefail

if ! command -v trivy &> /dev/null
then
  echo "trivy is not installed"
  exit 0
fi

IMAGE="$1"

TRIVY_OPTS="--config trivy.yaml --no-progress ${TRIVY_OPTS:-}"

trivy image $TRIVY_OPTS "$IMAGE" | tee trivy-report.txt
trivy image --exit-code 1 --severity "${TRIVY_MAX_SEVERITY:-HIGH,CRITICAL}" $TRIVY_OPTS "$IMAGE" > /dev/null
