#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const version = process.argv[2];

if (!version) {
  console.error('Usage: node scripts/update-version.js <version>');
  console.error('Example: node scripts/update-version.js 1.0.3');
  process.exit(1);
}

// Validate version format (semver)
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Invalid version format. Use semver format: X.Y.Z (e.g., 1.0.3)');
  process.exit(1);
}

const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Update version
appJson.expo.version = version;

// Update iOS buildNumber
appJson.expo.ios.buildNumber = version;

// Increment Android versionCode
appJson.expo.android.versionCode = (appJson.expo.android.versionCode || 1) + 1;

// Generate runtimeVersion with package-lock.json hash
const packageLockPath = path.join(__dirname, '..', 'package-lock.json');
const packageLockContent = fs.readFileSync(packageLockPath, 'utf8');
const packageLockHash = crypto.createHash('md5').update(packageLockContent).digest('hex').substring(0, 8);
appJson.expo.runtimeVersion = `${version}-${packageLockHash}`;

// Write back to file
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`✅ Version updated to ${version}`);
console.log(`   iOS buildNumber: ${version}`);
console.log(`   Android versionCode: ${appJson.expo.android.versionCode}`);
console.log(`   runtimeVersion: ${appJson.expo.runtimeVersion}`);
