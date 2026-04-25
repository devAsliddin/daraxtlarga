#!/usr/bin/env node
const { execSync } = require('child_process');

process.env.BUILD_TARGET = 'capacitor';
process.env.NEXT_PUBLIC_API_URL = 'http://45.92.173.175:3002';

console.log('Building for Capacitor (Android)...');
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

try {
  execSync('npx --no-install next build', { stdio: 'inherit', env: process.env, shell: true });
  console.log('\nBuild successful! Now sync to Android:');
  console.log('  npx cap sync android');
} catch (e) {
  process.exit(1);
}
