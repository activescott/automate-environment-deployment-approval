#!/usr/bin/env sh
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory
THISSCRIPT=$(basename $0)

rm -rf "${THISDIR}/node_modules"
rm -rf "${THISDIR}/coverage"
rm -rf "${THISDIR}/dist"
git clean -fx