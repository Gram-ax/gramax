#!/bin/bash
echo "Installing packages"
for p in $(fd -a package.json --type f -x dirname {} | sort); do
  echo Installing: "$p"
  npm --prefix "$p" --force ci --cache .npm --prefer-offline --no-audit
done

echo "Building schemes"
npm run build:schemes

if [ "$(command -v ln)"  ]; then
  echo "Making symlinks"

  ln -s "../../core/public" "target/next"
fi

echo "Done"
