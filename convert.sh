#!/bin/bash

function convert () {
  echo $1
  cucumber_file=$1

}

directory=$1
for cucumber_file in "$directory"/*; do
  filename=$(node -e 'console.log(process.argv[1].replace("./features/", "").replace(".feature", "").replace(/\//g, "-").replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[\s_]+/g, "-").replace("--", "-").toLowerCase())' $cucumber_file)
  module=$(node -e 'console.log(process.argv[1].replace("./features/", "").replace(".feature", "").replace("//", "/"))' $cucumber_file)

  jest_file="./tests/migrated/$filename.test.ts"

  JEST_FILENAME="$filename" JEST_MODULE="$module" node -r ts-node/register ./node_modules/.bin/cucumber-js $cucumber_file

done

  npm run test:jest "./tests/migrated"
