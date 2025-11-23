#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const nodemailer = require('nodemailer');
const { execSync } = require('child_process');

const BRANCH = process.argv[2] || 'staging';
const VERSION = process.argv[3] || '1.0.0';
const MESSAGE = `Release v${VERSION}`;

// Load subscribers
const subscribersPath = path.join(__dirname, '..', 'subscribers.json');
if (!fs.existsSync(subscribersPath)) {
  console.error('❌ subscribers.json not found!');
  console.error('Create it from subscribers.json.example');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(subscribersPath, 'utf8'));
const subscribers = config[BRANCH] || [];
const smtpConfig = config.smtp;

if (subscribers.length === 0) {
  console.log(`No subscribers found for ${BRANCH} branch`);
  process.exit(0);
}

console.log(`Found ${subscribers.length} subscribers for ${BRANCH}`);

// Get latest build URL from EAS
async function getLatestBuildUrl() {
  try {
    console.log('Fetching latest build info from EAS...');
    const output = execSync(`eas build:list --platform android --profile ${BRANCH} --limit 1 --json`, {
      encoding: 'utf8'
    });
    
    const builds = JSON.parse(output);
    if (builds.length === 0) {
      throw new Error('No builds found');
    }
    
    const latestBuild = builds[0];
    if (!latestBuild.artifacts || !latestBuild.artifacts.buildUrl) {
      throw new Error('Build URL not found');
    }
    
    return {
      url: latestBuild.artifacts.buildUrl,
      version: latestBuild.appVersion,
      buildNumber: latestBuild.appBuildVersion
    };
  } catch (error) {
    console.error('Error fetching build info:', error.message);
    throw error;
  }
}

// Download APK
async function downloadApk(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log('Downloading APK...');
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log('✅ APK downloaded successfully');
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('✅ APK downloaded successfully');
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

// Send email with APK attachment
async function sendEmail(subscriber, apkPath, buildInfo) {
  const transporter = nodemailer.createTransport(smtpConfig);
  
  const mailOptions = {
    from: smtpConfig.auth.user,
    to: subscriber.email,
    subject: `QR Track - New ${BRANCH} Build Available`,
    html: `
      <h2>New QR Track Build Available</h2>
      <p>Hi ${subscriber.name},</p>
      <p>A new build of QR Track is available for the <strong>${BRANCH}</strong> channel.</p>
      
      <h3>Build Information:</h3>
      <ul>
        <li><strong>Version:</strong> ${buildInfo.version}</li>
        <li><strong>Build Number:</strong> ${buildInfo.buildNumber}</li>
        <li><strong>Channel:</strong> ${BRANCH}</li>
      </ul>
      
      <h3>Installation Instructions:</h3>
      <ol>
        <li>Download the attached APK file</li>
        <li>Enable "Install from unknown sources" in Android settings if needed</li>
        <li>Open the APK file to install</li>
        <li>The app will update to the new version</li>
      </ol>
      
      <p>If you have any issues, please contact support.</p>
      
      <p>Best regards,<br>QR Track Team</p>
    `,
    attachments: [
      {
        filename: `qr-track-${BRANCH}-${buildInfo.version}.apk`,
        path: apkPath
      }
    ]
  };
  
  await transporter.sendMail(mailOptions);
}

// Main distribution function
async function distribute() {
  try {
    // Get latest build info
    const buildInfo = await getLatestBuildUrl();
    console.log(`Build version: ${buildInfo.version} (${buildInfo.buildNumber})`);
    
    // Download APK
    const apkPath = path.join(__dirname, '..', 'temp-build.apk');
    await downloadApk(buildInfo.url, apkPath);
    
    // Send to all subscribers
    console.log(`\nSending APK to ${subscribers.length} subscribers...`);
    for (const subscriber of subscribers) {
      try {
        console.log(`Sending to ${subscriber.name} (${subscriber.email})...`);
        await sendEmail(subscriber, apkPath, buildInfo);
        console.log(`✅ Sent to ${subscriber.email}`);
      } catch (error) {
        console.error(`❌ Failed to send to ${subscriber.email}:`, error.message);
      }
    }
    
    // Cleanup
    fs.unlinkSync(apkPath);
    console.log('\n✅ Distribution completed!');
    
  } catch (error) {
    console.error('❌ Distribution failed:', error.message);
    process.exit(1);
  }
}

distribute();
