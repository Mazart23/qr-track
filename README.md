# QR Track - Machine Tracking Application

QR code tracking application for managing machines and maintenance reports.

## Features

- **Machine Management**: Track machines using QR codes
- **Report System**: Add maintenance reports with configurable intervals
- **Status Indicators**: Visual status system (today/overdue/no reports)
- **Multi-language**: English and Polish support
- **Theme Support**: Light and dark mode
- **GPS Location**: Automatic location capture for new machines
- **Offline Storage**: All data stored locally using AsyncStorage

## Installation

### For End Users

#### Android
1. Download the APK file from the releases
2. Enable "Install from Unknown Sources" in Android settings
3. Install the APK
4. Grant camera and location permissions when prompted

#### iOS
1. Install via TestFlight link (if provided)
2. Or install via Xcode for development

### For Developers

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Build for Android
npx eas build --platform android --profile production

# Build for iOS
npx eas build --platform ios --profile production
```

## Building Production Version

### Prerequisites
- Expo account (create at https://expo.dev)
- EAS CLI installed: `npm install -g eas-cli`

### Build Steps

1. **Login to Expo**
```bash
eas login
```

2. **Configure project**
```bash
eas build:configure
```

3. **Build Android APK**
```bash
eas build --platform android --profile production
```

4. **Build iOS**
```bash
eas build --platform ios --profile production
```

The build will be available in your Expo dashboard and you can download the APK/IPA file.

## Quick Build (Local APK)

For a quick local Android build without EAS:

```bash
npx expo run:android --variant release
```

## Configuration

### Report Intervals
Available intervals: 1 day, 7 days, 14 days, 1 month, 2 months, 3 months, 4 months, 6 months, 1 year

### Languages
- English (en)
- Polish (pl)

## Permissions

- **Camera**: Required for QR code scanning
- **Location**: Optional, used to record machine locations

## Tech Stack

- React Native (Expo)
- TypeScript
- AsyncStorage (local database)
- i18next (internationalization)
- Expo Camera
- Expo Location
- Expo Router

## Version

Current version: 1.0.0

## License

Proprietary
