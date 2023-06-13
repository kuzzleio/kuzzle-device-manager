#!/bin/sh

[ -z "$BACKEND_COMMAND" ] && BACKEND_COMMAND="npm run dev"

if [ -d $PWD/node_modules ] && [ ! -z "$(ls $PWD/node_modules)" ]; then
  echo "run"
  eval "$BACKEND_COMMAND"
else
  echo "Need to install"
  npm install
  eval "$BACKEND_COMMAND"
fi
