---
sidebar_position: 1
---

# Dual-Write to Customer.io

Learn how to use dual-write mode to send data to both Codematic OpenCDP and Customer.io simultaneously.

## Overview

Dual-write mode allows you to send `identify()` and `track()` calls to both Codematic OpenCDP and Customer.io at the same time. This is useful when:

- **Migrating** from Customer.io to Codematic OpenCDP
- **Running in parallel** during a transition period
- **Testing** Codematic OpenCDP before full migration
- **Maintaining redundancy** across platforms

:::info Email & Push NOT Dual-Written
Transactional emails (`sendEmail`) and push notifications (`sendPush`) are **NOT** sent to Customer.io to avoid duplicate messages.
:::

## Configuration

Enable dual-write by providing Customer.io credentials:

```typescript
import { CDPClient } from '@codematic.io/cdp-node';

const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  sendToCustomerIo: true,
  customerIo: {
    siteId: process.env.CUSTOMERIO_SITE_ID,
    apiKey: process.env.CUSTOMERIO_API_KEY,
    region: 'us' // or 'eu' for European data centers
  }
});
```

## What Gets Dual-Written

### ✅ Sent to Both Platforms

These operations are sent to both OpenCDP and Customer.io:

#### identify()

```typescript
// Sent to both OpenCDP and Customer.io
await client.identify('user123', {
  email: 'user@example.com',
  name: 'John Doe',
  plan: 'premium'
});
```

#### track()

```typescript
// Sent to both OpenCDP and Customer.io
await client.track('user123', 'purchase_completed', {
  amount: 99.99,
  currency: 'USD'
});
```

#### registerDevice()

```typescript
// Sent to both OpenCDP and Customer.io
await client.registerDevice('user123', {
  deviceId: 'device_abc',
  platform: 'ios',
  fcmToken: 'fcm_token_here'
});
```

### ❌ NOT Dual-Written

These operations are sent **only** to OpenCDP:

#### sendEmail()

```typescript
// Only sent via OpenCDP (not Customer.io)
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_EMAIL'
});
```

**Warning displayed:**
```
[CDP] Warning: Transactional messaging email will NOT be sent to Customer.io 
to avoid sending twice. To turn this warning off set `sendToCustomerIo` to false.
```

#### sendPush()

```typescript
// Only sent via OpenCDP (not Customer.io)
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_PUSH',
  title: 'Welcome!',
  body: 'Thanks for joining'
});
```

**Warning displayed:**
```
[CDP] Warning: Transactional messaging push will NOT be sent to Customer.io 
to avoid sending twice. To turn this warning off set `sendToCustomerIo` to false.
```

## Error Handling

If a Customer.io request fails, the error is logged but **does not throw**. The OpenCDP request continues normally.

```typescript
// Even if Customer.io fails, OpenCDP request succeeds
await client.identify('user123', {
  email: 'user@example.com'
});

// CDP: ✅ Success
// Customer.io: ❌ Failed (logged, but doesn't throw)
```

This ensures your application isn't affected by Customer.io failures during the transition period.
<!-- 
## Migration Strategy

### Phase 1: Enable Dual-Write

Start sending data to both platforms:

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  sendToCustomerIo: true,
  customerIo: {
    siteId: process.env.CUSTOMERIO_SITE_ID,
    apiKey: process.env.CUSTOMERIO_API_KEY,
    region: 'us'
  },
  debug: true // Monitor both platforms
});
```

**Duration:** 1-2 weeks

**Goals:**
- Verify data reaches both platforms
- Compare data quality
- Test OpenCDP features
- Identify any issues

### Phase 2: Run in Parallel

Continue dual-write while transitioning features:

```typescript
// Keep dual-write enabled
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  sendToCustomerIo: true,
  customerIo: { ... }
});

// Gradually move features from Customer.io to CDP
// Example: Move email templates
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_EMAIL' // Now using OpenCDP template
});
```

**Duration:** 2-4 weeks

**Goals:**
- Migrate campaigns to CDP
- Update email templates
- Test workflows
- Train team on CDP

### Phase 3: Disable Dual-Write

Once confident, disable dual-write:

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  sendToCustomerIo: false, // Disable dual-write
  debug: false
});
```

**Goals:**
- Verify OpenCDP is handling all traffic
- Monitor for issues
- Decommission Customer.io -->

## Monitoring Dual-Write

Enable debug mode to see what's happening:

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  sendToCustomerIo: true,
  customerIo: { ... },
  debug: true // Enable detailed logging
});

await client.identify('user123', {
  email: 'user@example.com'
});

// Logs:
// [Customer.io] Identified user123
// [CDP] Identified user123
```

## Custom Logger for Monitoring

Use a custom logger to track both platforms:

```typescript
import pino from 'pino';

const logger = pino();

const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  sendToCustomerIo: true,
  customerIo: { ... },
  cdpLogger: {
    debug: (msg) => {
      logger.debug(msg);
      
      // Track dual-write metrics
      if (msg.includes('[Customer.io]')) {
        metrics.increment('customerio.calls');
      } else if (msg.includes('[CDP]')) {
        metrics.increment('cdp.calls');
      }
    },
    error: (msg, ctx) => {
      logger.error(ctx, msg);
      
      // Alert on Customer.io failures
      if (msg.includes('[Customer.io]') && msg.includes('error')) {
        alerting.notify('customerio_error', ctx);
      }
    },
    warn: (msg) => logger.warn(msg)
  }
});
```
<!-- 

## Performance Considerations

Dual-write adds latency since requests are made to two platforms:

```typescript
// Single platform (faster)
await client.identify('user123', { ... }); // ~100ms

// Dual-write (slower)
await client.identify('user123', { ... }); // ~200ms
```

### Mitigation Strategies

#### 1. Fire and Forget

For non-critical operations, don't await:

```typescript
// Don't block on dual-write
client.identify('user123', {
  email: 'user@example.com'
}).catch(err => console.error('Identify failed:', err));

// Continue immediately
res.json({ success: true });
```

#### 2. Background Processing

Queue dual-write operations:

```typescript
import Queue from 'bull';

const cdpQueue = new Queue('cdp-events');

// Queue instead of blocking
cdpQueue.add('identify', {
  userId: 'user123',
  properties: { email: 'user@example.com' }
});

// Worker processes queue
cdpQueue.process('identify', async (job) => {
  await client.identify(job.data.userId, job.data.properties);
});
```

#### 3. Increase Concurrency

Allow more parallel requests:

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  sendToCustomerIo: true,
  customerIo: { ... },
  maxConcurrentRequests: 30 // Maximum
});
``` -->

## Troubleshooting

### Customer.io Requests Failing

If Customer.io requests consistently fail:

```typescript
// Check credentials
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  sendToCustomerIo: true,
  customerIo: {
    siteId: 'verify_this',
    apiKey: 'verify_this',
    region: 'us' // or 'eu'
  },
  debug: true // See error details
});
```

Common issues:
- Invalid `siteId` or `apiKey`
- Wrong `region` (US vs EU)
- Customer.io rate limiting
- Network connectivity issues

### Duplicate Messages

If users receive duplicate emails:

```typescript
// ✅ Correct - Emails only go through CDP
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_EMAIL'
});

// ❌ Don't do this - Will send duplicates
await customerIoClient.sendEmail({ ... }); // Manual Customer.io call
await client.sendEmail({ ... }); // OpenCDP call
```

### Suppressing Warnings

To suppress dual-write warnings for emails/push:

```typescript
// Option 1: Set sendToCustomerIo to false (recommended)
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  sendToCustomerIo: false // No warnings
});

// Option 2: Filter in custom logger
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  sendToCustomerIo: true,
  cdpLogger: {
    warn: (msg) => {
      // Suppress specific warnings
      if (!msg.includes('NOT be sent to Customer.io')) {
        console.warn(msg);
      }
    }
  }
});
```

## Best Practices

### 1. Start with Debug Mode

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  sendToCustomerIo: true,
  customerIo: { ... },
  debug: true // Monitor both platforms
});
```

### 2. Monitor Both Platforms

Track metrics for both OpenCDP and Customer.io:


### 3. Plan Your Migration

- Set clear milestones
- Test thoroughly in staging
- Roll out gradually
- Have rollback plans

### 4. Disable Dual-Write When Done

Once migration is complete:

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  // Remove Customer.io config
  debug: false
});
```

## Related

- [Configuration Guide](../getting-started/configuration.md)
- [Error Handling](./error-handling.md)
- [Best Practices](./best-practices.md)

