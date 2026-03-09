#!/bin/sh

[ -d ../plugin/dist ] || npm --prefix ../plugin run build;
[ -d dist ] || mkdir 'dist';
cd ../plugin
find dist -name '*.d.ts' -exec cp --parents '{}' ../types \;
