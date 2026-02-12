---
sidebar_position: 3
---

# Best Practices

Follow these best practices to get the most out of the OpenCDP Node SDK.

## Configuration

### Use Environment Variables

Never hardcode API keys:

```typescript
// ✅ Good
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY
});

// ❌ Bad
const client = new CDPClient({
  cdpApiKey: 'sk_live_abc123...' // Never do this!
});
```

### Singleton Pattern

Create a single client instance and reuse it:

```typescript
// config/cdp.ts
import { CDPClient } from '@codematic.io/cdp-node';

export const cdpClient = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY!,
  maxConcurrentRequests: 20,
  timeout: 10000,
  debug: process.env.NODE_ENV === 'development'
});

// Use throughout your app
import { cdpClient } from './config/cdp';
```

### Test Connection at Startup

Verify configuration during application startup:

```typescript
import { cdpClient } from './config/cdp';

async function startApp() {
  try {
    await cdpClient.ping();
    console.log('OpenCDP connection verified ✓');
  } catch (error) {
    console.error('OpenCDP connection failed:', error);
    process.exit(1);
  }
  
  // Start your server
  app.listen(3000);
}

startApp();
```

## User Identification

### Consistent Identifiers

**Always use the same identifier for a user across all OpenCDP operations.** This is critical for ensuring data is correctly associated with user profiles.

```typescript
// ✅ Good - Use consistent user ID everywhere
const userId = user.id;

// Step 1: Identify the user
await client.identify(userId, {
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName
});

// Step 2: Track events with the same ID
await client.track(userId, 'purchase_completed', { amount: 99.99 });

// Step 3: Register device with the same ID
await client.registerDevice(userId, {
  deviceId: 'device_123',
  platform: 'ios',
  fcmToken: 'token_here'
});

// Step 4: Send communications with the same ID
await client.sendEmail({
  to: user.email,
  identifiers: { id: userId },
  transactional_message_id: 'WELCOME'
});

await client.sendPush({
  identifiers: { id: userId },
  transactional_message_id: 'NOTIFICATION'
});

// ❌ Bad - Switching between different identifier types
await client.identify(user.id, { email: user.email });
await client.track(user.email, 'purchase_completed', { ... }); // Different identifier!
await client.sendEmail({
  to: user.email,
  identifiers: { email: user.email }, // Different from identify()
  ...
});
```

:::warning Why This Matters
Using inconsistent identifiers can result in:
- Duplicate user profiles
- Events not being attributed to the correct user
- Emails/push notifications failing to send
- Incomplete user data
:::

### Person Attributes

The OpenCDP automatically recognizes and sets the following top-level person attributes:

| Property (snake_case) | Property (camelCase) | Person Attribute |
|----------------------|---------------------|------------------|
| `first_name` | `firstName` | `first_name` |
| `last_name` | `lastName` | `last_name` |
| `email` | `email` | `email` |

You can use either naming convention—the OpenCDP will automatically map them correctly.

```typescript
// Both of these are equivalent:

// Using camelCase
await client.identify('user123', {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com'
});

// Using snake_case
await client.identify('user123', {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com'
});
```

### Include Person Attributes Early

Include email, first name, and last name on first identification:

```typescript
// ✅ Good - Person attributes included immediately
await client.identify('user123', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  created_at: new Date().toISOString()
});

// ❌ Bad - Person attributes added later
await client.identify('user123', {
  created_at: new Date().toISOString()
});
// Later...
await client.identify('user123', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe'
});
```

Person attributes are crucial for:
- Email campaigns and personalization
- User matching and deduplication
- Segmentation and targeting
- Better customer support

### Use ISO 8601 for Dates

Always use ISO 8601 format for dates:

```typescript
// ✅ Good
await client.identify('user123', {
  created_at: new Date().toISOString(), // "2025-10-29T10:30:00.000Z"
  last_login: new Date().toISOString()
});

// ❌ Bad
await client.identify('user123', {
  created_at: '10/29/2025', // Ambiguous format
  last_login: Date.now()     // Timestamp instead of ISO string
});
```


## Error Handling

### Always Use Try-Catch

Wrap OpenCDP calls in try-catch blocks:

```typescript
// ✅ Good
try {
  await client.identify('user123', { email: 'user@example.com' });
} catch (error) {
  logger.error('Failed to identify user', { error: error.message });
}

// ❌ Bad
await client.identify('user123', { email: 'user@example.com' }); // Can crash app!
```

### Fire and Forget for Non-Critical Operations

For non-critical tracking, don't block:

```typescript
// ✅ Good - Don't block page rendering
client.track('user123', 'page_viewed', { page: '/home' })
  .catch(err => logger.error('Track failed', err));

res.render('home');

// ❌ Bad - Blocks page rendering
try {
  await client.track('user123', 'page_viewed', { page: '/home' });
} catch (error) {
  logger.error('Track failed', error);
}
res.render('home');
```

### Implement Retry Logic

Retry transient failures:

```typescript
async function trackWithRetry(
  userId: string,
  event: string,
  properties: Record<string, any>,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await client.track(userId, event, properties);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

## Performance

### Adjust Concurrency for Your Workload

```typescript
// Low-traffic application
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  maxConcurrentRequests: 5
});

// High-traffic application
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  maxConcurrentRequests: 30 // Maximum
});
```
<!-- 
### Use Batch Operations

Process multiple operations in parallel:

```typescript
// ✅ Good - Parallel (faster)
await Promise.all([
  client.identify('user1', { email: 'user1@example.com' }),
  client.identify('user2', { email: 'user2@example.com' }),
  client.identify('user3', { email: 'user3@example.com' })
]);

// ❌ Bad - Sequential (slower)
await client.identify('user1', { email: 'user1@example.com' });
await client.identify('user2', { email: 'user2@example.com' });
await client.identify('user3', { email: 'user3@example.com' });
```

### Queue Background Jobs

For large batches, use a job queue:

```typescript
import Queue from 'bull';

const cdpQueue = new Queue('cdp');

// Producer
async function queueIdentify(userId: string, properties: Record<string, any>) {
  await cdpQueue.add('identify', { userId, properties });
}

// Consumer
cdpQueue.process('identify', async (job) => {
  const { userId, properties } = job.data;
  await client.identify(userId, properties);
});
``` -->

## Security

### Never Log Sensitive Data

```typescript
// ✅ Good
logger.info('User identified', {
  userId: 'user123',
  email: 'u***@example.com' // Redacted
});

// ❌ Bad
logger.info('User identified', {
  userId: 'user123',
  email: 'user@example.com',
  password: 'secret123' // NEVER log passwords!
});
```

### Don't Send PII Unnecessarily

```typescript
// ✅ Good - Only send necessary data
await client.identify('user123', {
  email: 'user@example.com',
  name: 'John Doe',
  plan: 'premium'
});

// ❌ Bad - Sending sensitive data
await client.identify('user123', {
  email: 'user@example.com',
  name: 'John Doe',
  ssn: '123-45-6789',        // Don't send SSN!
  credit_card: '1234...',     // Don't send payment info!
  password_hash: '...'        // Don't send credentials!
});
```
<!-- 
### Validate Input

Validate data before sending:

```typescript
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function identifyUser(userId: string, email: string) {
  if (!userId || !email) {
    throw new Error('User ID and email required');
  }
  
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  await client.identify(userId, { email });
}
``` -->

## Email Best Practices

### Validate Email Addresses

```typescript
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendWelcomeEmail(email: string, userId: string) {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }
  
  await client.sendEmail({
    to: email,
    identifiers: { id: userId },
    transactional_message_id: 'WELCOME'
  });
}
```

## Push Notifications

### Register Devices Early

Register devices as soon as possible:

```typescript
// ✅ Good - Register on app launch
async function onAppLaunch() {
  const userId = await getCurrentUserId();
  const fcmToken = await getFCMToken();
  
  if (userId && fcmToken) {
    await client.registerDevice(userId, {
      deviceId: getDeviceId(),
      platform: 'ios',
      fcmToken,
      appVersion: getAppVersion()
    });
  }
}
```

### Use Consistent Device IDs

**Critical:** Each device must have a unique, persistent device ID that never changes.
<!-- 
```typescript
// ✅ Good - Persistent device ID
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem('device_id');
  
  if (!deviceId) {
    deviceId = uuidv4();
    await AsyncStorage.setItem('device_id', deviceId);
  }
  
  return deviceId;
}

// Always use the same device ID
const deviceId = await getOrCreateDeviceId();

// ❌ Bad - Generates new ID every time
await client.registerDevice(userId, {
  deviceId: uuidv4(), // DON'T DO THIS - creates new ID each time
  platform: 'ios',
  fcmToken: token
});

// ✅ Good - Uses persistent device ID
await client.registerDevice(userId, {
  deviceId: await getOrCreateDeviceId(), // Same ID always
  platform: 'ios',
  fcmToken: token
});
``` -->

See [Device ID Requirements](../api/register-device.md#device-id-requirements) for detailed information.

### Update Device Info Regularly

```typescript
// Update on each app launch
await client.registerDevice(userId, {
  deviceId: deviceId,
  platform: 'ios',
  fcmToken: currentToken,
  appVersion: '2.0.0', // Updated version
  last_active_at: new Date().toISOString()
});
```

### Keep Push Messages Concise

```typescript
// ✅ Good - Short and clear
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'ORDER_SHIPPED',
  title: 'Your order has shipped!',
  body: 'Track your package'
});

```
<!-- 
## Monitoring

### Track Success and Failure Rates

```typescript
async function identifyWithMetrics(userId: string, properties: Record<string, any>) {
  try {
    await client.identify(userId, properties);
    metrics.increment('cdp.identify.success');
  } catch (error) {
    metrics.increment('cdp.identify.error');
    throw error;
  }
}
```

### Monitor Latency

```typescript
async function trackWithTiming(userId: string, event: string, properties: Record<string, any>) {
  const start = Date.now();
  
  try {
    await client.track(userId, event, properties);
    metrics.timing('cdp.track.duration', Date.now() - start);
  } catch (error) {
    metrics.timing('cdp.track.error.duration', Date.now() - start);
    throw error;
  }
}
```

### Set Up Alerts

Monitor error rates and set up alerts:

```typescript
// Check error rate every minute
setInterval(async () => {
  const errorRate = await metrics.getRate('cdp.*.error', '1m');
  
  if (errorRate > 0.05) { // 5% error rate
    alerting.notify('high_cdp_error_rate', {
      rate: errorRate,
      threshold: 0.05
    });
  }
}, 60000);
``` -->

## Testing

### Mock OpenCDP Client in Tests

```typescript
import { CDPClient } from '@codematic.io/cdp-node';

jest.mock('@codematic.io/cdp-node');

describe('UserService', () => {
  test('identifies user on signup', async () => {
    const mockIdentify = jest.fn().mockResolvedValue(undefined);
    (CDPClient as jest.Mock).mockImplementation(() => ({
      identify: mockIdentify
    }));
    
    await userService.signup('user@example.com', 'password');
    
    expect(mockIdentify).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ email: 'user@example.com' })
    );
  });
});
```

### Use Test Environment

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.NODE_ENV === 'test' 
    ? 'test-key' 
    : process.env.CDP_API_KEY,
  cdpEndpoint: process.env.NODE_ENV === 'test'
    ? 'https://test-api.example.com'
    : undefined
});
```

## Related

- [Error Handling](./error-handling.md)
- [Testing Guide](./testing.md)
- [Configuration](../getting-started/configuration.md)
- [API Reference](../api/client.md)

