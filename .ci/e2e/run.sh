#!/bin/bash

INITIAL_PUSH_REPO_NAME=$GX_E2E_GITLAB_PUSH_REPO
LAST_EXIT_CODE=1
ATTEMPTS=1

if [ "$CI" == "true" ]; then
    ATTEMPTS=3
fi

for _ in $(seq 1 $ATTEMPTS); do
    GX_E2E_GITLAB_PUSH_REPO=$INITIAL_PUSH_REPO_NAME-$RANDOM

    ./.ci/e2e/repo-info.sh

    if npm --prefix e2e run test; then
        ./.ci/e2e/delete-repo.sh
        exit 0
    fi

    ./.ci/e2e/delete-repo.sh
done

./.ci/e2e/delete-repo.sh
exit $LAST_EXIT_CODE
