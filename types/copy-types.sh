#!/bin/sh

[ -d ../dist ] || npm --prefix ../ run build;
[ -d dist ] || mkdir 'dist';
cd ..
find dist -name '*.d.ts' -exec cp --parents '{}' ./types \;
