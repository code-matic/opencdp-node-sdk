---
sidebar_position: 3
---

# Configuration

Learn how to configure the OpenCDP Node SDK for your specific needs.

## Basic Configuration

The minimum configuration requires only your OpenCDP API key:

```typescript
import { CDPClient } from '@codematic.io/cdp-node';

const client = new CDPClient({
  cdpApiKey: 'your-cdp-api-key'
});
```


## Configuration Examples

### Development Environment

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  debug: true,
  timeout: 15000,
  maxConcurrentRequests: 5
});
```

### Production Environment

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  debug: false,
  timeout: 10000,
  maxConcurrentRequests: 20,
  cdpLogger: productionLogger
});
```

### Migration Scenario (Dual-Write)

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  sendToCustomerIo: true,
  customerIo: {
    siteId: process.env.CUSTOMERIO_SITE_ID,
    apiKey: process.env.CUSTOMERIO_API_KEY,
    region: 'us'
  },
  debug: false
});
```

### Custom Endpoint with Logging

```typescript
import pino from 'pino';

const logger = pino();

const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  cdpEndpoint: 'https://staging-api.opencdp.io/gateway/data-gateway',
  cdpLogger: {
    debug: (msg) => logger.debug(msg),
    error: (msg, ctx) => logger.error(ctx, msg),
    warn: (msg) => logger.warn(msg)
  }
});
```

## Configuration Options

### CDPConfig Interface

```typescript
interface CDPConfig {
  // Required
  cdpApiKey: string;
  
  // Optional OpenCDP settings
  cdpEndpoint?: string;
  cdpLogger?: Logger;
  maxConcurrentRequests?: number;
  timeout?: number;
  
  // Optional Customer.io settings
  sendToCustomerIo?: boolean;
  customerIo?: {
    siteId: string;
    apiKey: string;
    region?: 'us' | 'eu';
  };
  
  // General settings
  debug?: boolean;
}
```

## Required Options

### cdpApiKey

Your OpenCDP API key for authentication.

```typescript
cdpApiKey: 'your-cdp-api-key'
```

:::danger Keep Your API Key Secret
Never commit your API key to version control. Use environment variables instead:

```typescript
cdpApiKey: process.env.CDP_API_KEY
```
:::

## Optional OpenCDP Settings

### cdpEndpoint

Custom endpoint URL for the OpenCDP API. Defaults to `https://api.opencdp.io/gateway/data-gateway`.

```typescript
cdpEndpoint: 'https://custom-endpoint.example.com'
```

**Use case**: Testing against a staging environment or using a custom proxy.

### maxConcurrentRequests

Maximum number of concurrent requests to the OpenCDP API. Default: `10`, Maximum: `30`.

```typescript
maxConcurrentRequests: 20
```

**Use case**: Adjust based on your application's traffic patterns. Higher values allow more parallel requests but may impact system resources.

:::info Concurrency Limiting
The SDK uses [p-limit](https://github.com/sindresorhus/p-limit) internally to prevent overwhelming the OpenCDP API with too many concurrent requests. Requests beyond the limit are queued automatically.
:::

### timeout

Request timeout in milliseconds. Default: `10000` (10 seconds).

```typescript
timeout: 5000 // 5 seconds
```

**Use case**: Adjust based on your network conditions and requirements.

### cdpLogger

Custom logger implementation. Defaults to console logging.

```typescript
const customLogger = {
  debug: (message: string) => myLogger.debug(message),
  error: (message: string, context?: Record<string, any>) => myLogger.error(message, context),
  warn: (message: string) => myLogger.warn(message)
};

const client = new CDPClient({
  cdpApiKey: 'your-key',
  cdpLogger: customLogger
});
```

**Use case**: Integrate with your existing logging infrastructure (e.g., Winston, Pino, Bunyan).

## Debug Mode

### debug

Enable debug logging for troubleshooting. Default: `false`.

```typescript
debug: true
```

:::warning Production Warning
Debug mode increases memory usage and log verbosity. **Do not enable in production.**
:::

**What gets logged in debug mode:**
- Connection status
- Identify/track calls with user IDs
- Email and push notification sends
- Customer.io dual-write operations
- Error details with stack traces

## Customer.io Dual-Write

### sendToCustomerIo

Enable dual-write to Customer.io. Default: `false`.

```typescript
sendToCustomerIo: true
```

### customerIo

Customer.io credentials for dual-write mode.

```typescript
customerIo: {
  siteId: 'your-customer-io-site-id',
  apiKey: 'your-customer-io-api-key',
  region: 'us' // or 'eu' for European data centers
}
```

:::info When to Use Dual-Write
Dual-write is useful when migrating from Customer.io to Codematic CDP. It sends data to both platforms simultaneously. See the [Dual-Write Guide](../guides/dual-write.md) for details.
:::


## Environment Variables

A recommended approach for managing configuration:

```bash
# .env file
CDP_API_KEY=your-cdp-api-key
CDP_ENDPOINT=https://api.opencdp.io/gateway/data-gateway
CDP_MAX_CONCURRENT=20
CDP_TIMEOUT=10000

# For dual-write
CUSTOMERIO_SITE_ID=your-site-id
CUSTOMERIO_API_KEY=your-api-key
CUSTOMERIO_REGION=us
```

```typescript
// config.ts
import { CDPClient } from '@codematic.io/cdp-node';

export const cdpClient = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY!,
  cdpEndpoint: process.env.CDP_ENDPOINT,
  maxConcurrentRequests: parseInt(process.env.CDP_MAX_CONCURRENT || '10'),
  timeout: parseInt(process.env.CDP_TIMEOUT || '10000'),
  sendToCustomerIo: process.env.CUSTOMERIO_SITE_ID ? true : false,
  customerIo: process.env.CUSTOMERIO_SITE_ID ? {
    siteId: process.env.CUSTOMERIO_SITE_ID,
    apiKey: process.env.CUSTOMERIO_API_KEY!,
    region: (process.env.CUSTOMERIO_REGION as 'us' | 'eu') || 'us'
  } : undefined,
  debug: process.env.NODE_ENV === 'development'
});
```

## Connection Testing

Test your configuration with the `ping()` method:

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY
});

try {
  await client.ping();
  console.log('Successfully connected to CDP!');
} catch (error) {
  console.error('Failed to connect:', error);
}
```

:::tip
Call `ping()` once during application startup to verify your configuration is correct. Don't call it before every request—connections are automatically managed via connection pooling.
:::

## Next Steps

- Explore the [API Reference](../api/client.md)
- Learn about [Error Handling](../guides/error-handling.md)
- Review [Best Practices](../guides/best-practices.md)

