#!/usr/bin/env bash

if [ -z "$VERSION" ]; then echo "Error: VERSION is not set"; exit 1; fi
if [ -z "$PLATFORM" ]; then echo "Error: PLATFORM is not set"; exit 1; fi

update_package_json_version() {
  local tmp
  tmp=$(mktemp)
  jq --arg v "$VERSION" '.version = $v' package.json > "$tmp" && mv "$tmp" package.json
}

update_package_json_version

bun run "build:$PLATFORM"
