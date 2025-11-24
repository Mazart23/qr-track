#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
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
    const output = execSync(`eas build:list --platform android --buildProfile ${BRANCH} --limit 1 --json --non-interactive`, {
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



// Email translations
const translations = {
  en: {
    subject: `QR Track - New ${BRANCH} Build Available (v{{version}})`,
    title: 'New QR Track Build Available',
    greeting: 'Hi {{name}},',
    intro: `A new build of QR Track is available for the <strong>${BRANCH}</strong> channel.`,
    buildInfo: 'Build Information:',
    version: 'Version:',
    buildNumber: 'Build Number:',
    channel: 'Channel:',
    download: 'Download:',
    downloadButton: 'Download APK (v{{version}})',
    instructions: 'Installation Instructions:',
    step1: 'Click the download button above or copy this link: <a href="{{url}}">{{url}}</a>',
    step2: 'Download the APK file to your Android device',
    step3: 'Enable "Install from unknown sources" in Android settings if needed',
    step4: 'Open the downloaded APK file to install',
    step5: 'The app will update to the new version',
    note: '<strong>Note:</strong> The download link expires after 30 days.',
    support: 'If you have any issues, please contact support.',
    regards: 'Best regards,<br>QR Track Team'
  },
  pl: {
    subject: `QR Track - Nowa wersja ${BRANCH} dostępna (v{{version}})`,
    title: 'Nowa wersja QR Track dostępna',
    greeting: 'Cześć {{name}},',
    intro: `Nowa wersja QR Track jest dostępna dla kanału <strong>${BRANCH}</strong>.`,
    buildInfo: 'Informacje o wersji:',
    version: 'Wersja:',
    buildNumber: 'Numer buildu:',
    channel: 'Kanał:',
    download: 'Pobierz:',
    downloadButton: 'Pobierz APK (v{{version}})',
    instructions: 'Instrukcja instalacji:',
    step1: 'Kliknij przycisk powyżej lub skopiuj link: <a href="{{url}}">{{url}}</a>',
    step2: 'Pobierz plik APK na urządzenie Android',
    step3: 'Włącz "Instalacja z nieznanych źródeł" w ustawieniach Androida jeśli potrzeba',
    step4: 'Otwórz pobrany plik APK aby zainstalować',
    step5: 'Aplikacja zaktualizuje się do nowej wersji',
    note: '<strong>Uwaga:</strong> Link do pobrania wygasa po 30 dniach.',
    support: 'W razie problemów skontaktuj się z supportem.',
    regards: 'Pozdrawiam,<br>Zespół QR Track'
  }
};

// Send email with download link
async function sendEmail(subscriber, buildInfo) {
  const transporter = nodemailer.createTransport(smtpConfig);
  const lang = subscriber.language || 'en';
  const t = translations[lang] || translations.en;
  
  const replace = (str, vars) => {
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
  };
  
  const mailOptions = {
    from: smtpConfig.auth.user,
    to: subscriber.email,
    subject: replace(t.subject, { version: buildInfo.version }),
    html: `
      <h2>${t.title}</h2>
      <p>${replace(t.greeting, { name: subscriber.name })}</p>
      <p>${t.intro}</p>
      
      <h3>${t.buildInfo}</h3>
      <ul>
        <li><strong>${t.version}</strong> ${buildInfo.version}</li>
        <li><strong>${t.buildNumber}</strong> ${buildInfo.buildNumber}</li>
        <li><strong>${t.channel}</strong> ${BRANCH}</li>
      </ul>
      
      <h3>${t.download}</h3>
      <p style="margin: 20px 0;">
        <a href="${buildInfo.url}" style="display: inline-block; padding: 12px 24px; background-color: #4338ca; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          ${replace(t.downloadButton, { version: buildInfo.version })}
        </a>
      </p>
      
      <h3>${t.instructions}</h3>
      <ol>
        <li>${replace(t.step1, { url: buildInfo.url })}</li>
        <li>${t.step2}</li>
        <li>${t.step3}</li>
        <li>${t.step4}</li>
        <li>${t.step5}</li>
      </ol>
      
      <p>${t.note}</p>
      
      <p>${t.support}</p>
      
      <p>${t.regards}</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

// Main distribution function
async function distribute() {
  try {
    // Get latest build info
    const buildInfo = await getLatestBuildUrl();
    console.log(`Build version: ${buildInfo.version} (${buildInfo.buildNumber})`);
    console.log(`Download URL: ${buildInfo.url}`);
    
    // Send to all subscribers
    console.log(`\nSending download link to ${subscribers.length} subscribers...`);
    for (const subscriber of subscribers) {
      try {
        console.log(`Sending to ${subscriber.name} (${subscriber.email})...`);
        await sendEmail(subscriber, buildInfo);
        console.log(`✅ Sent to ${subscriber.email}`);
      } catch (error) {
        console.error(`❌ Failed to send to ${subscriber.email}:`, error.message);
      }
    }
    
    console.log('\n✅ Distribution completed!');
    
  } catch (error) {
    console.error('❌ Distribution failed:', error.message);
    process.exit(1);
  }
}

distribute();
