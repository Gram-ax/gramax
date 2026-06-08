#!/bin/bash

INITIAL_PUSH_REPO_NAME=$GX_E2E_GITLAB_PUSH_REPO
LAST_EXIT_CODE=1
ATTEMPTS=1

if [ "$CI" == "true" ]; then
    ATTEMPTS=1
fi

for i in $(seq 1 $ATTEMPTS); do
    GX_E2E_GITLAB_PUSH_REPO=$INITIAL_PUSH_REPO_NAME-$RANDOM-$i

    ./.ci/e2e/repo-info.sh

    npm --prefix e2e run test
    LAST_EXIT_CODE=$?
done

./.ci/e2e/delete-repos.ts
exit $LAST_EXIT_CODE
