#!/usr/bin/env bash

if [ -z "$VERSION" ]; then echo "Error: VERSION is not set"; exit 1; fi
if [ -z "$PLATFORM" ]; then echo "Error: PLATFORM is not set"; exit 1; fi

BUILDOS=""

update_package_json_version() {
  local tmp
  tmp=$(mktemp)
  jq --arg v "$VERSION" '.version = $v' package.json > "$tmp" && mv "$tmp" package.json
}

set_buildos_based_on_platform() {
  case $PLATFORM in
    linux)
      BUILDOS="linux"
      ;;
    windows)
      BUILDOS="win32"
      ;;
    macos)
      BUILDOS="darwin"
      ;;
    *)
      echo "Error: PLATFORM $PLATFORM is not supported"
      exit 1
      ;;
  esac
}

set_buildos_based_on_platform
update_package_json_version

npm run make -- --arch=x64 --platform=$BUILDOS
