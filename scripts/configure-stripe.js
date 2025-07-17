#!/usr/bin/env node
/**
 * bpay Stripe Configuration Script
 * 
 * This script helps configure Stripe settings for bpay
 * Usage: node scripts/configure-stripe.js [test|live]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  const mode = process.argv[2] || 'test';
  
  if (!['test', 'live'].includes(mode)) {
    console.error('Usage: node scripts/configure-stripe.js [test|live]');
    process.exit(1);
  }

  console.log(`\n🚀 Configuring bpay for Stripe ${mode.toUpperCase()} mode\n`);

  // Read current .env file
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Helper function to update or add env variable
  const updateEnvVar = (key, value) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `${key}=${value}\n`;
    }
  };

  // Collect Stripe keys based on mode
  const keyPrefix = mode === 'test' ? 'sk_test_' : 'sk_live_';
  const pubKeyPrefix = mode === 'test' ? 'pk_test_' : 'pk_live_';

  console.log(`📝 Enter your Stripe ${mode} mode credentials:\n`);

  // Get secret key
  const secretKey = await question(`Secret Key (starts with ${keyPrefix}): `);
  if (!secretKey.startsWith(keyPrefix)) {
    console.error(`❌ Error: Secret key must start with ${keyPrefix}`);
    process.exit(1);
  }

  // Get publishable key
  const pubKey = await question(`Publishable Key (starts with ${pubKeyPrefix}): `);
  if (!pubKey.startsWith(pubKeyPrefix)) {
    console.error(`❌ Error: Publishable key must start with ${pubKeyPrefix}`);
    process.exit(1);
  }

  // Get webhook secret (optional for development)
  const webhookSecret = await question('Webhook Secret (optional for development): ');

  // Update environment variables
  updateEnvVar('STRIPE_SECRET_KEY', secretKey);
  updateEnvVar('VITE_STRIPE_PUBLIC_KEY', pubKey);
  updateEnvVar('NODE_ENV', mode === 'test' ? 'development' : 'production');

  if (webhookSecret) {
    updateEnvVar('STRIPE_WEBHOOK_SECRET', webhookSecret);
  }

  // Write updated .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Configuration updated successfully!');
  console.log(`📁 Environment file: ${envPath}`);
  console.log(`🔧 Mode: ${mode.toUpperCase()}`);
  
  if (mode === 'test') {
    console.log('\n🧪 Test Mode Features:');
    console.log('- Uses mock Stripe Issuing calls');
    console.log('- Safe for development and testing');
    console.log('- No real money transactions');
    console.log('- Sample bcards and funding sources');
  } else {
    console.log('\n🌟 Live Mode Features:');
    console.log('- Real Stripe Issuing integration');
    console.log('- Production-ready card generation');
    console.log('- Real money transactions');
    console.log('- Full PCI compliance required');
  }

  console.log('\n🔄 Next steps:');
  console.log('1. Restart your application: npm run dev');
  console.log('2. Test bcard creation in the payment demo');
  console.log('3. Verify webhook configuration (for live mode)');
  
  if (mode === 'live') {
    console.log('\n⚠️  Production Checklist:');
    console.log('- [ ] Stripe Issuing enabled in your account');
    console.log('- [ ] Business verification completed');
    console.log('- [ ] Webhook endpoints configured');
    console.log('- [ ] SSL certificates installed');
    console.log('- [ ] Database migrations run');
    console.log('- [ ] Monitoring and logging configured');
  }

  rl.close();
}

main().catch(console.error);