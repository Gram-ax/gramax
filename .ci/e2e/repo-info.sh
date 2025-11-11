#!/bin/bash

printf "Using repos:\n \
      > as push: %s\%s\%s \n \
      > as clone: %s\%s\%s \n" \
"$GX_E2E_GITLAB_URL_NEW" "$GX_E2E_GITLAB_GROUP" "$GX_E2E_GITLAB_PUSH_REPO" "$GX_E2E_GITLAB_DOMAIN" "$GX_E2E_GITLAB_GROUP" "$GX_E2E_GITLAB_TEST_REPO"
