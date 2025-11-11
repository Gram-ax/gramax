#!/bin/bash

git fetch --tags

TAGS=$(git tag --sort=-creatordate | head -n 2)
LAST_TAG=$(echo "$TAGS" | sed -n 1p)
PREVIOUS_TAG=$(echo "$TAGS" | sed -n 2p)

eval "$(ssh-agent -s)"
cat "$GITHUB_DEPLOY_PRIVATE_SSH_KEY" | ssh-add -
ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts

git clone --no-checkout git@github.com:gram-ax/gramax.git temp


rm -rf .git
mv temp/.git ./
rm -rf temp

./.ci/sync/delete-secrets.sh
trufflehog filesystem . --fail --filter-entropy=4.5 --print-avg-detector-time --exclude-paths=.git/config

git config --global user.email "$GITHUB_DEPLOY_USER_EMAIL"
git config --global user.name "$GITHUB_DEPLOY_USER_NAME"


git add -A
git commit -m "Changes from $PREVIOUS_TAG to $LAST_TAG"
git push -u origin master
