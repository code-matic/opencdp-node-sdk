---
draft: true
---

---
sidebar_position: 5
---

# Migration from Customer.io

Guide for migrating from Customer.io to Codematic OpenCDP.

## Overview

This guide helps you migrate from Customer.io to Codematic OpenCDP with minimal disruption using the SDK's built-in dual-write capability.

## Migration Phases

### Phase 1: Enable Dual-Write (Week 1-2)

Start sending data to both platforms:

```typescript
import { CDPClient } from '@codematic.io/cdp-node';

const client = new CDPClient({
  // OpenCDP configuration
  cdpApiKey: process.env.CDP_API_KEY,
  
  // Enable dual-write
  sendToCustomerIo: true,
  customerIo: {
    siteId: process.env.CUSTOMERIO_SITE_ID,
    apiKey: process.env.CUSTOMERIO_API_KEY,
    region: 'us'
  },
  
  debug: true // Monitor both platforms
});
```

**Goals:**
- ✅ Verify data reaches both platforms
- ✅ Compare data quality
- ✅ Identify any discrepancies
- ✅ Test OpenCDP features

### Phase 2: Migrate Templates (Week 3-4)

Move your email and push templates to OpenCDP:

**Before (Customer.io):**
```typescript
// Direct Customer.io usage
await customerIoClient.sendEmail({
  to: 'user@example.com',
  transactional_message_id: 1,
  identifiers: { id: 'user123' },
  message_data: { name: 'John' }
});
```

**After (OpenCDP with dual-write):**
```typescript
// Using OpenCDP SDK
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_EMAIL', // OpenCDP template
  message_data: { name: 'John' }
});
```

**Template Migration Checklist:**
- [ ] Export all templates from Customer.io
- [ ] Recreate templates in OpenCDP
- [ ] Test each template
- [ ] Update template IDs in code
- [ ] Verify deliverability

### Phase 3: Migrate Campaigns (Week 5-6)

Move automated campaigns and workflows:

1. **Document existing workflows** in Customer.io
2. **Recreate in CDOpenCDPP** using OpenCDP's campaign builder
3. **Test each workflow** with test users
4. **Gradually switch traffic** to OpenCDP campaigns

### Phase 4: Verify & Monitor (Week 7-8)

Ensure everything works correctly:

```typescript
// Custom monitoring
const cdpLogger = {
  debug: (msg) => {
    logger.debug(msg);
    
    // Track metrics
    if (msg.includes('[CDP]')) {
      metrics.increment('cdp.success');
    } else if (msg.includes('[Customer.io]')) {
      metrics.increment('customerio.success');
    }
  },
  error: (msg, ctx) => {
    logger.error(ctx, msg);
    
    // Alert on failures
    if (msg.includes('[CDP]') && msg.includes('error')) {
      alerting.notify('cdp_error', ctx);
    }
  },
  warn: (msg) => logger.warn(msg)
};

const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  sendToCustomerIo: true,
  customerIo: { ... },
  cdpLogger
});
```

### Phase 5: Disable Dual-Write (Week 9+)

Once confident, disable Customer.io:

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  // Remove Customer.io config
  sendToCustomerIo: false,
  debug: false
});
```

## Code Migration Examples

### Identify Users

**Before:**
```typescript
import { TrackClient } from 'customerio-node';

const cio = new TrackClient(siteId, apiKey);

await cio.identify('user123', {
  email: 'user@example.com',
  name: 'John Doe'
});
```

**After:**
```typescript
import { CDPClient } from '@codematic.io/cdp-node';

const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY
});

await client.identify('user123', {
  email: 'user@example.com',
  name: 'John Doe'
});
```

### Track Events

**Before:**
```typescript
await cio.track('user123', {
  name: 'purchase_completed',
  data: {
    amount: 99.99,
    currency: 'USD'
  }
});
```

**After:**
```typescript
await client.track('user123', 'purchase_completed', {
  amount: 99.99,
  currency: 'USD'
});
```

### Send Transactional Email

**Before:**
```typescript
await cio.sendEmail({
  to: 'user@example.com',
  transactional_message_id: 1,
  identifiers: { id: 'user123' },
  message_data: { name: 'John' }
});
```

**After:**
```typescript
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_EMAIL',
  message_data: { name: 'John' }
});
```

### Register Device

**Before:**
```typescript
await cio.addDevice('user123', 'device_token', 'ios', {
  device_id: 'device_abc'
});
```

**After:**
```typescript
await client.registerDevice('user123', {
  deviceId: 'device_abc',
  platform: 'ios',
  fcmToken: 'device_token'
});
```

## API Mapping

| Customer.io | OpenCDP SDK | Notes |
|------------|---------|-------|
| `identify()` | `identify()` | Same interface |
| `track()` | `track()` | Event name as second parameter |
| `sendEmail()` | `sendEmail()` | Update template IDs |
| `sendPush()` | `sendPush()` | Similar interface |
| `addDevice()` | `registerDevice()` | Different parameter structure |
| `destroy()` | N/A | Not needed - connections auto-managed |

## Data Consistency

Verify data matches across platforms:

```typescript
async function verifyMigration(userId: string) {
  // Get user from both platforms
  const cioUser = await customerIoAPI.getProfile(userId);
  const cdpUser = await cdpAPI.getProfile(userId);
  
  // Compare key attributes
  const discrepancies = [];
  
  if (cioUser.email !== cdpUser.email) {
    discrepancies.push('email');
  }
  
  if (cioUser.created_at !== cdpUser.created_at) {
    discrepancies.push('created_at');
  }
  
  if (discrepancies.length > 0) {
    console.warn(`Discrepancies found for ${userId}:`, discrepancies);
  }
  
  return discrepancies.length === 0;
}
```

## Rollback Plan

If issues arise, you can rollback:

```typescript
// Emergency rollback - disable CDP, keep Customer.io
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  sendToCustomerIo: true,
  customerIo: { ... }
});

// Configure to only send to Customer.io temporarily
// (Manual override in code if needed)
```

## Common Issues

### Template ID Mismatches

**Problem:** Customer.io uses numeric IDs, OpenCDP uses string IDs

**Solution:**
```typescript
// Create mapping
const TEMPLATE_MAP = {
  1: 'WELCOME_EMAIL',
  2: 'PASSWORD_RESET',
  3: 'ORDER_CONFIRMATION'
};

// Use in code
const cdpTemplateId = TEMPLATE_MAP[customerIoTemplateId];
```

### Different Event Schemas

**Problem:** Event properties structured differently

**Solution:**
```typescript
// Transform before sending
function transformEvent(cioEvent) {
  return {
    ...cioEvent.data,
    event_source: 'customerio_migration',
    migrated_at: new Date().toISOString()
  };
}

await client.track(
  userId,
  cioEvent.name,
  transformEvent(cioEvent)
);
```

### Rate Limiting

**Problem:** Hitting rate limits during bulk migration

**Solution:**
```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  maxConcurrentRequests: 10, // Lower concurrency
  timeout: 15000 // Longer timeout
});

// Add delays between batches
for (const batch of batches) {
  await processBatch(batch);
  await sleep(1000); // 1 second between batches
}
```

## Testing Migration

### Canary Deployment

Test with a small percentage of users first:

```typescript
function shouldUseCDP(userId: string): boolean {
  // Use OpenCDP for 10% of users
  const hash = hashCode(userId);
  return (hash % 100) < 10;
}

if (shouldUseCDP(userId)) {
  await cdpClient.identify(userId, properties);
} else {
  await customerIoClient.identify(userId, properties);
}
```

### A/B Testing

Compare deliverability between platforms:

```typescript
// Group A: Customer.io
// Group B: CDP

const results = {
  customerio: { sent: 0, delivered: 0, opened: 0 },
  cdp: { sent: 0, delivered: 0, opened: 0 }
};

// Track and compare metrics
```

## Post-Migration

After successful migration:

1. **Remove Customer.io dependencies:**
```bash
npm uninstall customerio-node
```

2. **Clean up code:**
```typescript
// Remove dual-write configuration
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY
  // No Customer.io config
});
```

3. **Update documentation** to reflect OpenCDP usage

4. **Archive Customer.io data** for compliance/audit

## Support

If you encounter issues during migration:

- Enable `debug: true` for detailed logs
- Check [Troubleshooting Guide](../troubleshooting.md)
- Review [Error Handling](./error-handling.md)
- Contact Codematic support

## Related

- [Dual-Write Guide](./dual-write.md)
- [Configuration](../getting-started/configuration.md)
- [Best Practices](./best-practices.md)

