# QR Track - Deployment Guide

## Quick Start - Build Production APK

### Method 1: EAS Build (Recommended)

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo (create account at expo.dev if needed)
eas login

# 3. Build Android APK
eas build --platform android --profile production

# 4. Download APK from expo.dev dashboard
```

### Method 2: Use Build Script

```bash
# Run the automated build script
./build-android.sh
```

## What You'll Get

- **Android APK**: ~50-100MB file ready to install
- **Build Time**: 15-30 minutes (first build), 5-10 minutes (subsequent)
- **Distribution**: Share APK file directly with users

## Files Created for Distribution

1. **qr-track.apk** - The installable Android app
2. **USER_GUIDE.md** - Instructions for end users
3. **README.md** - Technical documentation

## Sharing with Users

### Package to Send:
```
qr-track-v1.0.0/
├── qr-track.apk          (The app)
├── USER_GUIDE.md         (How to use)
└── INSTALL.txt           (Installation steps)
```

### Create INSTALL.txt:
```
QR Track Installation

1. Download qr-track.apk to your Android device
2. Open the file
3. Enable "Install from Unknown Sources" if prompted
4. Tap Install
5. Grant Camera and Location permissions
6. Open the app and start using!

For detailed instructions, see USER_GUIDE.md
```

## Build Profiles

- **production**: Full production build (use this)
- **preview**: Internal testing build
- **development**: Development build with debugging

## Configuration Files

- `app.json` - App metadata and configuration
- `eas.json` - Build configuration
- `package.json` - Dependencies

## App Details

- **Name**: QR Track
- **Package**: com.qrtrack.app
- **Version**: 1.0.0
- **Permissions**: Camera, Location (optional)

## Testing Before Distribution

```bash
# Test on your device
npx expo start
# Scan QR code with Expo Go app

# Or build preview APK
eas build --platform android --profile preview
```

## Updating the App

### Data Preservation
✅ **User data is automatically preserved** when updating!
- AsyncStorage data persists across updates
- Package name stays the same: `com.qrtrack.app`
- Users can install new version directly over old version

### Update Steps

1. Update version in `app.json`:
   ```json
   "version": "1.0.1",
   "android": {
     "versionCode": 2  // Must increment
   },
   "ios": {
     "buildNumber": "1.0.1"
   }
   ```

2. Rebuild:
   ```bash
   eas build --platform android --profile production
   ```

3. Distribute new APK to users
   - Users install directly over existing app
   - All machines and reports are preserved
   - No data loss!

See UPDATE_GUIDE.md for detailed information.

## iOS Build (Optional)

```bash
# Requires Apple Developer account ($99/year)
eas build --platform ios --profile production
```

## Troubleshooting

### Build fails
- Check internet connection
- Verify Expo account is active
- Try: `eas build:configure` to reset

### APK too large
- Current size is optimized (~50-100MB)
- This is normal for React Native apps

### Users can't install
- Ensure "Install from Unknown Sources" is enabled
- Check Android version (minimum: Android 5.0)

## Next Steps

1. Build the APK using one of the methods above
2. Test on your device
3. Package with USER_GUIDE.md
4. Share with users via email, cloud storage, or USB

## Support

- Expo Documentation: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
