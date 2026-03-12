#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"/../.. || exit 9

if ! command -v trivy &> /dev/null
then
  echo "trivy is not installed"
  exit 0
fi

IMAGE="$1"

TRIVY_OPTS="--config trivy.yaml --no-progress ${TRIVY_OPTS:-}"

trivy image $TRIVY_OPTS "$IMAGE" | tee trivy-report.txt
trivy image --exit-code 1 --severity "$TRIVY_MAX_SEVERITY" $TRIVY_OPTS "$IMAGE" > /dev/null
