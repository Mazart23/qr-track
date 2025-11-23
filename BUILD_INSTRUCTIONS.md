# Build Instructions for QR Track

## Option 1: Build with EAS (Recommended for Production)

### Setup (One-time)
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Configure the project
eas build:configure
```

### Build Android APK
```bash
# Production build
eas build --platform android --profile production

# After build completes, download APK from:
# https://expo.dev/accounts/[your-account]/projects/qr-track/builds
```

### Build iOS IPA
```bash
# Production build
eas build --platform ios --profile production
```

## Option 2: Local Android Build (Faster, No Expo Account Needed)

### Prerequisites
- Android Studio installed
- Android SDK configured
- Java JDK installed

### Build Steps
```bash
# Generate Android build
npx expo prebuild --platform android

# Build release APK
cd android
./gradlew assembleRelease

# APK will be at:
# android/app/build/outputs/apk/release/app-release.apk
```

## Option 3: Development Build for Testing

```bash
# Start Expo Go for testing
npx expo start

# Scan QR code with Expo Go app on your phone
```

## Sharing the App

### Android
1. Share the APK file directly
2. Users need to enable "Install from Unknown Sources"
3. Install and grant permissions

### iOS
1. Use TestFlight for distribution
2. Or share IPA file (requires device UDID registration)

## Build Outputs

- **Android**: APK file (~50-100MB)
- **iOS**: IPA file (~50-100MB)

## Troubleshooting

### "eas: command not found"
```bash
npm install -g eas-cli
```

### Android build fails
```bash
# Clear cache and rebuild
npx expo prebuild --clean
```

### iOS build requires Apple Developer account
- Sign up at https://developer.apple.com
- Add credentials in EAS dashboard

## Notes

- First build may take 15-30 minutes
- Subsequent builds are faster (5-10 minutes)
- APK can be installed directly on Android devices
- iOS requires TestFlight or enterprise distribution
