# OTA Updates Guide

## Expo Updates Configuration

The app uses Expo Updates to deliver Over-The-Air (OTA) updates without publishing a new version to the store.

## Update Channels

- **production** - production version for end users
- **staging** - testing version before production
- **development** - development version

## How Channels Work

The update channel is determined by the build profile used when creating the app:

```bash
# Build for staging channel
eas build --platform android --profile staging

# Build for production channel
eas build --platform android --profile production
```

**Important**: Users receive updates from the channel their app was built with:
- App built with `--profile staging` → receives updates from `staging` channel
- App built with `--profile production` → receives updates from `production` channel

### Distribution Strategy

1. **Internal testers**: Install APK built with `staging` profile
2. **End users**: Install APK built with `production` profile
3. **Developers**: Use development builds or Expo Go

This way you can test updates on staging before pushing to production users.

## Publishing Updates

### Method 1: Script (recommended)

```bash
# Staging (default)
./scripts/publish-update.sh -v 1.0.2

# Production
./scripts/publish-update.sh -b production -v 1.0.3

# Development
./scripts/publish-update.sh -b development -v 1.0.2
```

Examples:
```bash
./scripts/publish-update.sh -v 1.0.2
./scripts/publish-update.sh -b production -v 1.0.3
```

### Method 2: Direct EAS command

```bash
eas update --branch staging --message "OTA update v1.0.2"
eas update --branch production --message "Release v1.0.3"
```

## How OTA Updates Work

1. **Automatic download**: App checks for updates on startup
2. **Background installation**: Update downloads in the background
3. **Activation**: New version activates on next app restart
4. **Rollback**: Ability to revert to previous version if issues occur

## OTA Limitations

OTA updates CAN update:
- ✅ JavaScript/TypeScript code
- ✅ Assets (images, fonts)
- ✅ app.json configuration
- ✅ Pure JavaScript packages (e.g., lodash, date-fns)

OTA updates CANNOT update:
- ❌ Native code (Java/Kotlin/Swift/Objective-C)
- ❌ Native dependencies (packages with native modules)
- ❌ Expo SDK version
- ❌ Changes to app.json that affect native code (permissions, plugins)

### When New Build is Required

You need a new build when:
1. Installing packages with native code (e.g., `expo-camera`, `react-native-maps`)
2. Updating Expo SDK version
3. Changing native configuration in app.json
4. Modifying Android/iOS native code

```bash
# Check if package has native code
npx expo install --check

# If native changes detected, build new APK
eas build --platform android --profile production
```

### Distributing New Builds

**Important**: Expo Updates cannot automatically install new APK files. Users must manually install new builds.

**Distribution options:**
1. **Manual distribution**: Send APK file directly to users
2. **Internal distribution**: Use EAS Build's internal distribution
3. **Google Play**: Publish to Play Store (requires setup)
4. **Self-hosted**: Host APK on your server with download link

**Recommended workflow for native changes:**
```bash
# 1. Build new APK
eas build --platform android --profile production

# 2. Download APK from EAS Build dashboard
# 3. Distribute to users via your preferred method
# 4. Users manually install new APK
```

## Checking Update Status

```bash
# List all updates
eas update:list --branch production

# View specific update details
eas update:view [UPDATE_ID]
```

## Rollback to Previous Version

```bash
eas update:rollback --branch production
```

## Best Practices

1. **Test on staging**: Always test updates on staging channel before production
2. **Descriptive messages**: Use clear change descriptions
3. **Small updates**: Publish frequently, smaller changes
4. **Monitor**: Check logs and feedback after publishing
5. **Backup**: Keep rollback capability available
6. **Avoid native dependencies**: Prefer pure JS packages when possible to use OTA
7. **Version tracking**: Keep track of which users have which build version
8. **Notify users**: When new build is required, notify users to update manually

## Workflow

### For Code-Only Changes (OTA)

```bash
# 1. Make code changes
# 2. Test locally
npm start

# 3. Publish to staging (OTA)
./scripts/publish-update.sh -v 1.0.2

# 4. Test on staging devices
# 5. Publish to production (OTA)
./scripts/publish-update.sh -b production -v 1.0.2
```

### For Native Changes (New Build)

```bash
# 1. Install new package with native code
npm install some-native-package

# 2. Test locally
npm start

# 3. Publish to staging with version (auto-builds and distributes)
./scripts/publish-update.sh -v 1.0.3

# 4. Subscribers receive email with APK
# 5. Test on staging devices
# 6. Publish to production with version (auto-builds and distributes)
./scripts/publish-update.sh -b production -v 1.0.3
```

### Version Numbering

When specifying version with `-v` flag:
- Updates `expo.version` in app.json
- Updates `expo.ios.buildNumber` to same version
- Increments `expo.android.versionCode` by 1

Example: `-v 1.0.3` sets:
- version: "1.0.3"
- iOS buildNumber: "1.0.3"
- Android versionCode: (previous + 1)

## Automatic Build Distribution

The publish script automatically detects native dependency changes and builds + distributes new APK when needed.

### Setup

1. **Create subscribers list:**
```bash
cp subscribers.json.example subscribers.json
# Edit subscribers.json with your recipients
```

2. **Configure SMTP settings in subscribers.json:**
```json
{
  "staging": [
    {"name": "Tester 1", "email": "tester1@example.com"}
  ],
  "production": [
    {"name": "User 1", "email": "user1@example.com"}
  ],
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@gmail.com",
      "pass": "your-app-password"
    }
  }
}
```

**Note**: For Gmail, use App Password (not regular password)

### How It Works

1. **Script detects changes**: Compares package-lock.json with last version
2. **If native changes detected**:
   - Builds new APK via EAS Build
   - Downloads APK from EAS
   - Sends email to all subscribers with APK attached
3. **If no native changes**:
   - Publishes OTA update as usual

### Usage

```bash
# Normal OTA update (auto-detects if build needed)
./scripts/publish-update.sh -v 1.0.2

# Force new build with version number
./scripts/publish-update.sh -f -v 1.0.3

# Production build with version
./scripts/publish-update.sh -b production -v 1.0.4

# Staging update
./scripts/publish-update.sh -v 1.0.2
```

**Important**: Version flag (`-v`) is always required. Message is auto-generated from version.

### Manual Distribution

If you prefer manual distribution:

```bash
# 1. Build APK
eas build --platform android --profile staging

# 2. Download from EAS dashboard
# 3. Distribute manually
```
