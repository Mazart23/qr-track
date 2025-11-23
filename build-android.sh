#!/bin/bash

echo "🚀 Building QR Track Android APK..."
echo ""

# Check if eas-cli is installed
if ! command -v eas &> /dev/null
then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Check if logged in
echo "📝 Checking Expo login status..."
eas whoami || {
    echo "❌ Not logged in to Expo. Please login:"
    eas login
}

echo ""
echo "🔨 Starting production build..."
echo "This will take 15-30 minutes for the first build."
echo ""

eas build --platform android --profile production

echo ""
echo "✅ Build complete!"
echo "📦 Download your APK from: https://expo.dev"
echo ""
