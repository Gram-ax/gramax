#!/bin/bash

set -euo pipefail


printf "Delete push repo: %s/%s/%s\n" \
  "$GX_E2E_GITLAB_DOMAIN" "$GX_E2E_GITLAB_GROUP" "$GX_E2E_GITLAB_PUSH_REPO"

curl \
 -s -o /dev/null -w "Response HTTP Code: %{http_code}\n" \
 -H "Content-Type: application/json" \
 -H "PRIVATE-TOKEN: $GX_E2E_GITLAB_TOKEN" \
 -X DELETE \
https://"$GX_E2E_GITLAB_DOMAIN"/api/v4/projects/"$GX_E2E_GITLAB_GROUP"%2F"$GX_E2E_GITLAB_PUSH_REPO"
