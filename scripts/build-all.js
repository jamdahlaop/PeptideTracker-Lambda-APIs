#!/usr/bin/env node

/**
 * Build script for all Lambda functions
 * This script builds all Lambda functions in the project
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function runCommand(command, cwd) {
  console.log(`📦 Running: ${command} in ${cwd}`);
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

function buildService(serviceName) {
  const servicePath = path.join(__dirname, '..', 'src', serviceName);
  
  if (!fs.existsSync(servicePath)) {
    console.log(`⚠️  Service directory not found: ${servicePath}`);
    return false;
  }
  
  console.log(`\n🔨 Building ${serviceName}...`);
  
  // Install dependencies
  if (!runCommand('npm install', servicePath)) {
    return false;
  }
  
  // Build the service
  if (!runCommand('npm run build', servicePath)) {
    return false;
  }
  
  console.log(`✅ ${serviceName} built successfully!`);
  return true;
}

function main() {
  console.log('🚀 Building all Lambda functions...\n');
  
  const services = ['hello-world', 'auth_service'];
  let allSuccessful = true;
  
  for (const service of services) {
    if (!buildService(service)) {
      allSuccessful = false;
    }
  }
  
  if (allSuccessful) {
    console.log('\n🎉 All services built successfully!');
    console.log('\nYou can now:');
    console.log('1. Test locally: node scripts/test-local.js');
    console.log('2. Commit and push to GitHub for deployment');
  } else {
    console.log('\n❌ Some builds failed. Please check the errors above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildService };
