/**
 * Live gateway smoke test for the OpenCDP Node SDK.
 *
 * Usage:
 *   npm run smoke
 */

const { CDPClient } = require('./dist/cjs/index.js');

async function main() {
  const apiKey = process.env.CDP_API_KEY;
  if (!apiKey) {
    console.error('ERROR: Set CDP_API_KEY before running smoke.cjs');
    process.exit(1);
  }

  const userId = process.env.CDP_SMOKE_USER_ID ?? 'flutter_dev_test_001';

  const client = new CDPClient({
    cdpApiKey: apiKey,
    debug: true,
    failOnException: true,
  });

  console.log('Pinging gateway...');
  await client.ping();
  console.log('ping ok');

  console.log(`Identifying user ${userId}...`);
  await client.identify(userId, { plan: 'pro', name: 'Flutter Dev', source: 'node-smoke' });
  console.log('identify ok');

  console.log('Tracking sdk_smoke_test event...');
  await client.track(userId, 'sdk_smoke_test', { source: 'node', sdk: 'opencdp-node-sdk' });
  console.log('track ok');

  console.log('\nSmoke test passed.');
}

main().catch((error) => {
  console.error('\nSmoke test failed:', error?.message ?? error);
  process.exit(1);
});
