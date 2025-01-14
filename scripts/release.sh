#!/usr/bin/env bash

if [ -z "$VERSION" ]; then echo "Error: VERSION is not set"; exit 1; fi
if [ -z "$PLATFORM" ]; then echo "Error: PLATFORM is not set"; exit 1; fi

BIN_NAME="bananas"
RELEASE_ACTION="create"
GH_TAG="v$VERSION"
FILES=()

LINUX_FILES=(
  "dist/${BIN_NAME}_amd64.deb"
  "dist/${BIN_NAME}_arm64.deb"
  "dist/${BIN_NAME}_amd64.snap"
  "dist/${BIN_NAME}_arm64.snap"
  "dist/${BIN_NAME}_x86_64.AppImage"
  "dist/${BIN_NAME}_arm64.AppImage"
  "dist/${BIN_NAME}_x86_64.flatpak"
  "dist/${BIN_NAME}_arm64.flatpak"
)

WINDOWS_FILES=(
  "dist/${BIN_NAME}-setup_x64.exe"
)

MACOS_FILES=(
  "dist/${BIN_NAME}_universal.dmg"
)

set_release_action() {
  if gh release view "$GH_TAG" --json id --jq .id > /dev/null 2>&1; then
    echo "Release $GH_TAG already exists, updating it"
    RELEASE_ACTION="edit"
  else
    echo "Release $GH_TAG does not exist, creating it"
    RELEASE_ACTION="create"
  fi
}

check_files_exist() {
  files=()
  for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
      files+=("$file")
    fi
  done
  if [ ${#files[@]} -gt 0 ]; then
    echo "Error: the following files do not exist:"
    for file in "${files[@]}"; do
      printf " - %s\n" "$file"
    done
    echo "This is the content of the dist directory:"
    ls -l dist/
    exit 1
  fi
}

set_files_based_on_platform() {
  case $PLATFORM in
    linux)
      FILES=("${LINUX_FILES[@]}")
      ;;
    windows)
      FILES=("${WINDOWS_FILES[@]}")
      ;;
    macos)
      FILES=("${MACOS_FILES[@]}")
      ;;
    *)
      echo "Error: PLATFORM $PLATFORM is not supported"
      exit 1
      ;;
  esac
}

print_files() {
  echo "Files to upload:"
  for file in "${FILES[@]}"; do
    printf " - %s\n" "$file"
  done
}

do_gh_release() {
  if [ "$RELEASE_ACTION" == "edit" ]; then
    if [ -z "$REPLACE" ]; then
      echo "Trying to upload files to existing release $GH_TAG"
      print_files
      gh release upload "$GH_TAG" "${FILES[@]}"
    else
      echo "Overwriting existing release $GH_TAG"
      print_files
      gh release upload --clobber "$GH_TAG" "${FILES[@]}"
    fi
  else
    echo "Creating new release $GH_TAG"
    print_files
    gh release create --generate-notes "$GH_TAG" "${FILES[@]}"
  fi
}

release() {
  set_release_action
  set_files_based_on_platform
  check_files_exist
  do_gh_release
}

release
