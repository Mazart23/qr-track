#!/bin/bash

# Script to publish OTA updates or build new APK if native changes detected

BRANCH="staging"
FORCE_BUILD=false
VERSION=""

while getopts "b:fv:" opt; do
  case $opt in
    b) BRANCH="$OPTARG" ;;
    f) FORCE_BUILD=true ;;
    v) VERSION="$OPTARG" ;;
    *) ;;
  esac
done

shift $((OPTIND-1))

echo "Checking for native dependency changes..."

# Check if package-lock.json changed (native dependencies)
NATIVE_CHANGES=false

if [ -f ".last-package-lock.json" ]; then
  if ! diff -q package-lock.json .last-package-lock.json > /dev/null 2>&1; then
    echo "Package dependencies changed, checking if native build required..."
    NATIVE_CHANGES=true
  fi
else
  echo "First run, creating baseline..."
  cp package-lock.json .last-package-lock.json
fi

if [ "$FORCE_BUILD" = true ]; then
  echo "Force build flag set, building new APK..."
  NATIVE_CHANGES=true
fi

if [ "$NATIVE_CHANGES" = true ]; then
  echo ""
  echo "Native changes detected or forced build requested."
  
  if [ -z "$VERSION" ]; then
    echo "❌ Error: Version number required for new builds."
    echo "Use -v flag to specify version (e.g., -v 1.0.3)"
    exit 1
  fi
  
  echo "Updating version to $VERSION..."
  node scripts/update-version.js "$VERSION"
  
  if [ $? -ne 0 ]; then
    echo "❌ Failed to update version!"
    exit 1
  fi
  
  MESSAGE="Release v$VERSION"
  
  echo ""
  echo "Building new APK for $BRANCH..."
  echo "Message: $MESSAGE"
  echo ""
  
  # Build new APK
  eas build --platform android --profile "$BRANCH" --non-interactive --message "$MESSAGE"
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "Build completed successfully!"
    echo "Running distribution script..."
    node scripts/distribute-apk.js "$BRANCH" "$VERSION"
    
    # Update baseline
    cp package-lock.json .last-package-lock.json
    
    echo "✅ New build distributed to subscribers!"
  else
    echo "❌ Build failed!"
    exit 1
  fi
else
  if [ -z "$VERSION" ]; then
    echo "❌ Error: Version number required."
    echo "Use -v flag to specify version (e.g., -v 1.0.3)"
    exit 1
  fi
  
  MESSAGE="OTA update v$VERSION"
  
  echo "No native changes detected, publishing OTA update..."
  echo "Branch: $BRANCH"
  echo "Version: $VERSION"
  echo "Message: $MESSAGE"
  echo ""
  
  eas update --branch "$BRANCH" --message "$MESSAGE"
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ OTA update published successfully to $BRANCH!"
    echo "Users will receive the update on next app restart."
  else
    echo "❌ Update failed!"
    exit 1
  fi
fi
