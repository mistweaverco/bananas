#!/usr/bin/env bash

if [ -z "$VERSION" ]; then echo "Error: VERSION is not set"; exit 1; fi
if [ -z "$PLATFORM" ]; then echo "Error: PLATFORM is not set"; exit 1; fi

update_package_json_version() {
  local tmp
  tmp=$(mktemp)
  jq --arg v "$VERSION" '.version = $v' package.json > "$tmp" && mv "$tmp" package.json
}

update_package_json_version

build_windows() {
  bun run build && ./node_modules/.bin/electron-builder --win --publish never
}

build_linux() {
  bun run build && ./node_modules/.bin/electron-builder --linux --publish never
}

build_linux_arm64() {
  # NOTE:
  # One might imagine we could use `electron-builder --arm64` here, but
  # it doesn't work as expected.
  # There is an issue when building snap packages.
  # Instead, we build each target individually.
  bun run build && ./node_modules/.bin/electron-builder --linux deb --publish never --arm64 && \
    bun run build && ./node_modules/.bin/electron-builder --linux flatpak --publish never --arm64 && \
    bun run build && ./node_modules/.bin/electron-builder --linux appimage --publish never --arm64
}

build_linux_debug() {
  bun run build && ./node_modules/.bin/electron-builder --linux deb --publish never
}

build_macos() {
  bun run build && ./node_modules/.bin/electron-builder --mac --publish never
}

case $PLATFORM in
  "linux")
    build_linux
    ;;
  "linux-arm64")
    build_linux_arm64
    ;;
  "linux-debug")
    build_linux_debug
    ;;
  "macos")
    build_macos
    ;;
  "windows")
    build_windows
    ;;
  *)
    echo "Error: PLATFORM $PLATFORM is not supported"
    exit 1
    ;;
esac
