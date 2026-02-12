---
sidebar_position: 1
---

# CDPClient

The `CDPClient` class is the main interface for interacting with the Codematic OpenCDP.

## Constructor

### new CDPClient(config: CDPConfig)

Creates a new OpenCDP client instance.

```typescript
import { CDPClient } from '@codematic.io/cdp-node';

const client = new CDPClient({
  cdpApiKey: 'your-api-key'
});
```

**Parameters:**
- `config` ([CDPConfig](./types.md#cdpconfig)) - Configuration options

**Returns:** `CDPClient` instance

## Methods

### ping()

Tests the connection to the OpenCDP API server.

```typescript
await client.ping();
```

**Returns:** `Promise<void>`

**Throws:** Error if connection fails

**When to use:**
- During application startup to verify configuration
- For health checks

**Important:** Do NOT call this before every request. The SDK uses connection pooling and automatically manages connections.

```typescript
// ✅ Good - Check once at startup
try {
  await client.ping();
  console.log('OpenCDP connection verified');
} catch (error) {
  console.error('OpenCDP connection failed:', error);
  process.exit(1);
}

// ❌ Bad - Don't ping before every request
await client.ping();
await client.identify('user123', { email: 'user@example.com' });
```

---

### identify()

Identifies a user and sets their attributes. See [identify API reference](./identify.md).

```typescript
await client.identify(identifier, properties);
```

---

### track()

Tracks a custom event for a user. See [track API reference](./track.md).

```typescript
await client.track(identifier, eventName, properties);
```

---

### sendEmail()

Sends a transactional email. See [sendEmail API reference](./send-email.md).

```typescript
await client.sendEmail(request);
```

---

### sendPush()

Sends a push notification. See [sendPush API reference](./send-push.md).

```typescript
await client.sendPush(request);
```

---

### registerDevice()

Registers a device for push notifications. See [registerDevice API reference](./register-device.md).

```typescript
await client.registerDevice(identifier, deviceParams);
```

## Properties

### Private Properties

The `CDPClient` class maintains several private properties for internal use:

- `apiRoot` - Base URL for OpenCDP API
- `axiosInstance` - Configured Axios instance with connection pooling
- `customerIoClient` - Customer.io client (if dual-write enabled)
- `limit` - Concurrency limiter (p-limit)
- `logger` - Logger instance
- `sendToCustomerIo` - Dual-write flag
- `timeout` - Request timeout

These properties are managed internally and should not be accessed directly.

## Connection Management

The SDK automatically manages connections using:

- **HTTP Keep-Alive**: Connections are reused to reduce latency
- **Connection Pooling**: Up to 50 concurrent sockets with 10 free sockets kept alive
- **Automatic Retries**: Failed connections are handled gracefully

Configuration:

```typescript
// These are the internal defaults (you don't need to set them)
{
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  freeSocketTimeout: 30000
}
```

## Concurrency Limiting

The SDK uses [p-limit](https://github.com/sindresorhus/p-limit) to prevent overwhelming the OpenCDP API:

- **Default limit**: 10 concurrent requests
- **Maximum limit**: 30 concurrent requests
- **Behavior**: Requests beyond the limit are queued automatically

```typescript
const client = new CDPClient({
  cdpApiKey: 'your-key',
  maxConcurrentRequests: 20 // Adjust based on your needs
});
```

This ensures your application doesn't send too many requests simultaneously, which could:
- Overwhelm the OpenCDP API
- Cause rate limiting
- Impact your application's performance

## Error Handling

All methods are `async` and may throw errors. Always use try-catch:

```typescript
try {
  await client.identify('user123', {
    email: 'user@example.com'
  });
} catch (error) {
  console.error('Failed to identify user:', error.message);
  // Handle error appropriately
}
```

See [Error Handling Guide](../guides/error-handling.md) for comprehensive error handling patterns.

## Example Usage

### Basic Setup

```typescript
import { CDPClient } from '@codematic.io/cdp-node';

const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  debug: process.env.NODE_ENV === 'development'
});

// Verify connection at startup
await client.ping();
```

### With Custom Logger

```typescript
import pino from 'pino';

const logger = pino();

const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  cdpLogger: {
    debug: (msg) => logger.debug(msg),
    error: (msg, ctx) => logger.error(ctx, msg),
    warn: (msg) => logger.warn(msg)
  }
});
```

### High-Throughput Scenario

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  maxConcurrentRequests: 30, // Maximum allowed
  timeout: 15000, // 15 seconds
  debug: false // Disable debug in production
});
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import { CDPClient, CDPConfig } from '@codematic.io/cdp-node';

const config: CDPConfig = {
  cdpApiKey: 'your-key',
  debug: true
};

const client: CDPClient = new CDPClient(config);
```

## Related

- [Configuration Guide](../getting-started/configuration.md)
- [Error Handling](../guides/error-handling.md)
- [Best Practices](../guides/best-practices.md)

