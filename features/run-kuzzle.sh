#!/bin/sh

set -e

node features/fixtures/application/app.js &

echo "[$(date)] - Starting Kuzzle..."
while ! curl -f -s -o /dev/null http://localhost:7512
do
    echo "[$(date)] - Still trying to connect to Kuzzle"
    sleep 5
done

