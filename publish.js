// publish.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.join(__dirname, 'package.json');
let originalPackageJsonContent;

try {
  originalPackageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
} catch (e) {
  console.error('Error reading package.json:', e.message);
  process.exit(1);
}

// Parse original package.json to get base details
let originalPackageJson;
try {
  originalPackageJson = JSON.parse(originalPackageJsonContent);
} catch (e) {
  console.error('Error parsing original package.json content:', e.message);
  process.exit(1);
}

const SCOPED_NAME = originalPackageJson.name; // This will be @codematic.io/cdp-node
const UNSCOPED_NAME = 'cdp-node';
const TARGET_VERSION = originalPackageJson.version; // The version currently in package.json

function restorePackageJson() {
  console.log('\nRestoring package.json to original state...');
  fs.writeFileSync(packageJsonPath, originalPackageJsonContent, 'utf8');
  console.log('package.json restored.');
  // Recommended: run npm install to ensure package-lock.json is in sync with the restored package.json
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('npm install completed after restore.');
  } catch (e) {
    console.warn('npm install failed after restore, may need manual intervention:', e.message);
  }
}

// Ensure package.json is restored even if the process is interrupted
process.on('SIGINT', () => {
  console.warn('\nProcess interrupted. Attempting to restore package.json...');
  restorePackageJson();
  process.exit(1);
});

async function main() {
  const args = process.argv.slice(2);
  const targetType = args[0]; // 'scoped' or 'unscoped'

  let packageName;
  let accessFlag = '';

  if (targetType === 'scoped') {
    packageName = SCOPED_NAME;
    accessFlag = '--access public'; // Always use public access for scoped public packages
  } else if (targetType === 'unscoped') {
    packageName = UNSCOPED_NAME;
    // No access flag needed for unscoped public packages
  } else {
    console.error('Usage: node publish.js <scoped|unscoped>');
    process.exit(1);
  }

  console.log(`\n--- Publishing ${packageName}@${TARGET_VERSION} ---`);

  // Temporarily modify package.json for this specific package
  let tempPackageJson = JSON.parse(originalPackageJsonContent); // Get a fresh copy of original content
  tempPackageJson.name = packageName;
  // The version is already TARGET_VERSION from the original package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(tempPackageJson, null, 2), 'utf8');
  console.log(`package.json name temporarily changed to: ${packageName}`);

  try {
    // 1. Run build script
    console.log('Running build script...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('Build complete.');

    // 2. Publish
    const publishCommand = `npm publish ${accessFlag}`;
    console.log(`Executing: ${publishCommand}`);
    execSync(publishCommand, { stdio: 'inherit' });
    console.log(`Successfully published ${packageName}@${TARGET_VERSION}!`);

  } catch (error) {
    console.error(`Failed to publish ${packageName}@${TARGET_VERSION}:`, error.message);
    restorePackageJson(); // Ensure package.json is always restored at the very end
    process.exit(1); // Exit with error code
  } finally {
    restorePackageJson(); // Ensure package.json is always restored at the very end
  }
}

main();