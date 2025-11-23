# QR Track - Update Guide

## How Updates Work

✅ **Your data is safe!** When you install a new version of QR Track, all your machines and reports are automatically preserved.

## Why Data is Preserved

- Data is stored using the app's package name: `com.qrtrack.app`
- As long as the package name stays the same, data persists across updates
- No need to backup or export data before updating

## Updating the App

### For Users

#### Android
1. Download the new APK file (e.g., `qr-track-v1.1.0.apk`)
2. Open the APK file
3. Tap "Update" or "Install"
4. Your data will be automatically preserved
5. Open the app - all machines and reports are still there!

#### iOS
1. Update via TestFlight (if using TestFlight)
2. Or install new IPA file
3. Data is automatically preserved

### Important Notes

✅ **Safe to Update**:
- Installing new version over old version
- Same package name (`com.qrtrack.app`)
- Data is preserved automatically

❌ **Data Will Be Lost If**:
- You uninstall the app completely before installing new version
- You clear app data in Android settings
- Package name changes (won't happen with our updates)

## For Developers - Creating Updates

### Step 1: Update Version Numbers

Edit `app.json`:

```json
{
  "expo": {
    "version": "1.1.0",  // Increment this
    "android": {
      "versionCode": 2   // Increment this (was 1)
    },
    "ios": {
      "buildNumber": "1.1.0"  // Increment this
    }
  }
}
```

### Step 2: Build New Version

```bash
# Build new APK
eas build --platform android --profile production

# Or use the script
./build-android.sh
```

### Step 3: Distribute

Share the new APK with users. They can install directly over the old version.

## Version History

### Version 1.0.0 (Initial Release)
- Machine tracking with QR codes
- Report management
- Multi-language support (EN/PL)
- Theme support (Light/Dark)
- GPS location tracking

### Future Updates
When releasing updates, increment version numbers and rebuild. Users can install directly over existing installation.

## Testing Updates

Before distributing:

1. Install current version on test device
2. Add some test data (machines, reports)
3. Build and install new version
4. Verify data is still present
5. Test new features

## Backup (Optional)

While data persists across updates, users can optionally backup by:
- Taking screenshots of important data
- Exporting reports (if export feature is added)
- Using Android backup features

## FAQ

**Q: Will I lose my data when updating?**
A: No, data is automatically preserved when installing new version over old version.

**Q: Do I need to uninstall the old version first?**
A: No, just install the new APK directly. Android will update the app.

**Q: What if I accidentally uninstall?**
A: Data will be lost. Always update by installing new version over old version.

**Q: Can I downgrade to an older version?**
A: Yes, but only if the versionCode is higher or equal. Data will be preserved.

## Support

If data is lost after update, it may be due to:
- Complete uninstall before reinstall
- Clearing app data in settings
- Different package name (shouldn't happen)

Contact your system administrator for assistance.
