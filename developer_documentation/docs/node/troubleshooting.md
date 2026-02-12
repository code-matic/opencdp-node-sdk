---
sidebar_position: 8
---

# Troubleshooting

Common issues and their solutions.

## Connection Issues

### Cannot Connect to OpenCDP API

**Symptoms:**
- `ENOTFOUND` or DNS lookup errors
- Connection timeout errors

**Solutions:**

1. **Verify API endpoint:**
```typescript
const client = new CDPClient({
  cdpApiKey: 'your-key',
  debug: true // See connection details
});

await client.ping(); // Test connection
```

2. **Check network connectivity:**
```bash
curl https://api.opencdp.io/gateway/data-gateway/v1/health/ping
```

3. **Verify firewall rules** allow outbound HTTPS traffic

### Authentication Errors (401)

**Symptoms:**
- `401 Unauthorized` errors
- "Invalid API key" messages

**Solutions:**

1. **Verify API key is correct:**
```typescript
console.log('API Key:', process.env.CDP_API_KEY?.substring(0, 10) + '...');
```

2. **Check environment variables** are loaded:
```typescript
import dotenv from 'dotenv';
dotenv.config();
```

3. **Ensure API key** isn't expired or revoked

## Request Failures

### Timeout Errors

**Symptoms:**
- `ECONNABORTED` errors
- Requests taking too long

**Solutions:**

1. **Increase timeout:**
```typescript
const client = new CDPClient({
  cdpApiKey: 'your-key',
  timeout: 30000 // 30 seconds
});
```

2. **Check network latency**

3. **Reduce concurrent requests:**
```typescript
maxConcurrentRequests: 10 // Lower value
```

### Rate Limiting (429)

**Symptoms:**
- `429 Too Many Requests` errors

**Solutions:**

1. **Implement exponential backoff:**
```typescript
async function identifyWithBackoff(userId: string, properties: any) {
  let delay = 1000;
  
  for (let i = 0; i < 5; i++) {
    try {
      return await client.identify(userId, properties);
    } catch (error) {
      if (error.response?.status === 429) {
        await sleep(delay);
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
}
```

2. **Reduce concurrency:**
```typescript
maxConcurrentRequests: 5
```

3. **Add delays between batches:**
```typescript
for (const batch of batches) {
  await processBatch(batch);
  await sleep(1000); // 1 second delay
}
```

## Email Issues

### Template Not Found (404)

**Symptoms:**
- `404 Not Found` errors when sending emails
- "Template not found" messages

**Solutions:**

1. **Verify template ID** exists in CDP
2. **Check template ID** is spelled correctly
3. **Ensure template** is published/active

### Email Not Delivered

**Symptoms:**
- Email sends successfully but not received

**Checklist:**

1. **Check spam folder**
2. **Verify email address** is valid
3. **Check email logs** in OpenCDP dashboard
4. **Verify sender domain** is configured
5. **Check bounce/complaint rates**

### Validation Errors

**Symptoms:**
- "Invalid email address format"
- "to is required"

**Solutions:**

```typescript
// Validate before sending
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (!isValidEmail(email)) {
  throw new Error('Invalid email');
}
```

## Push Notification Issues

### No Devices Registered

**Symptoms:**
- Push sends successfully but not received
- "No registered devices" error

**Solutions:**

1. **Verify device registration:**
```typescript
await client.registerDevice(userId, {
  deviceId: 'device_abc',
  platform: 'ios',
  fcmToken: 'valid_token'
});
```

2. **Check FCM token** is valid and not expired

3. **Verify user has** at least one registered device

### Push Not Received

**Checklist:**

1. **Check device has** push notifications enabled
2. **Verify FCM configuration** in Firebase
3. **Check app** is not in background (iOS)
4. **Verify APNS certificate** (iOS)
5. **Check FCM token** hasn't expired

## Customer.io Dual-Write Issues

### Customer.io Requests Failing

**Symptoms:**
- Customer.io errors in logs
- Data not appearing in Customer.io

**Solutions:**

1. **Verify Customer.io credentials:**
```typescript
const client = new CDPClient({
  cdpApiKey: 'your-cdp-key',
  sendToCustomerIo: true,
  customerIo: {
    siteId: 'verify_this',
    apiKey: 'verify_this',
    region: 'us' // or 'eu'
  },
  debug: true // See error details
});
```

2. **Check correct region** (US vs EU)

3. **Verify Customer.io API key** has correct permissions

### Duplicate Messages

**Symptoms:**
- Users receiving duplicate emails

**Solutions:**

1. **Disable dual-write** for emails:
```typescript
// Emails are NOT dual-written by design
// If getting duplicates, check for manual Customer.io calls
```

2. **Remove manual Customer.io calls** if using OpenCDP SDK

## Performance Issues

### Memory Leaks

**Symptoms:**
- Memory usage growing over time
- Application crashes

**Solutions:**

1. **Disable debug mode** in production:
```typescript
debug: false
```

2. **Use single client instance** (singleton pattern)

3. **Don't create multiple** client instances

## Debugging

### Enable Debug Mode

```typescript
const client = new CDPClient({
  cdpApiKey: 'your-key',
  debug: true // Detailed logs
});
```

### Custom Logger

```typescript
import pino from 'pino';

const logger = pino();

const client = new CDPClient({
  cdpApiKey: 'your-key',
  cdpLogger: {
    debug: (msg) => logger.debug(msg),
    error: (msg, ctx) => logger.error(ctx, msg),
    warn: (msg) => logger.warn(msg)
  }
});
```

### Test Connection

```typescript
try {
  await client.ping();
  console.log('Connection successful!');
} catch (error) {
  console.error('Connection failed:', {
    message: error.message,
    code: error.code,
    status: error.response?.status
  });
}
```

## Getting Help

If you're still experiencing issues:

1. **Enable debug mode** and collect logs
2. **Document the error** with full stack trace
3. **Note your configuration** (without API keys)
4. **Provide code sample** that reproduces the issue
5. **Contact support** with all details

## Related

- [Error Handling Guide](./guides/error-handling.md)
- [Configuration](./getting-started/configuration.md)
- [Best Practices](./guides/best-practices.md)

