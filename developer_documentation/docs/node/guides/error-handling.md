---
sidebar_position: 2
---

# Error Handling

Learn how to handle errors effectively when using the OpenCDP Node SDK.

## Overview

The OpenCDP Node SDK uses async/await and throws errors for failed operations. All methods return Promises that may reject with errors.

## Error Types

### Validation Errors

Thrown when request parameters are invalid:

```typescript
try {
  // Empty identifier
  await client.identify('', { email: 'user@example.com' });
} catch (error) {
  console.error(error.message); // "Identifier cannot be empty"
}
```

### CDPEmailError

Thrown by `sendEmail()` when email delivery fails:

```typescript
try {
  await client.sendEmail({
    to: 'user@example.com',
    identifiers: { id: 'user123' },
    transactional_message_id: 'MISSING_TEMPLATE'
  });
} catch (error) {
  console.error({
    name: error.name,           // 'CDPEmailError'
    code: error.code,           // 'EMAIL_SEND_FAILED'
    message: error.message,     // Error description
    status: error.status,       // HTTP status code (e.g., 404)
    summary: error.summary      // Detailed error info
  });
}
```

### CDPPushError

Thrown by `sendPush()` when push delivery fails:

```typescript
try {
  await client.sendPush({
    identifiers: { id: 'user123' },
    transactional_message_id: 'MISSING_TEMPLATE',
    title: 'Test',
    body: 'Test'
  });
} catch (error) {
  console.error({
    name: error.name,           // 'CDPPushError'
    code: error.code,           // 'PUSH_SEND_FAILED'
    message: error.message,     // Error description
    status: error.status,       // HTTP status code
    summary: error.summary      // Detailed error info
  });
}
```

### Network Errors

Axios network errors for connection issues:

```typescript
try {
  await client.identify('user123', { email: 'user@example.com' });
} catch (error) {
  if (error.code === 'ECONNABORTED') {
    console.error('Request timeout');
  } else if (error.code === 'ENOTFOUND') {
    console.error('DNS lookup failed - check endpoint');
  } else {
    console.error('Network error:', error.message);
  }
}
```

## Common Error Scenarios

### Invalid API Key

```typescript
try {
  await client.identify('user123', { email: 'user@example.com' });
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid API key - check your credentials');
  }
}
```

### Template Not Found

```typescript
try {
  await client.sendEmail({
    to: 'user@example.com',
    identifiers: { id: 'user123' },
    transactional_message_id: 'NONEXISTENT_TEMPLATE'
  });
} catch (error) {
  if (error.status === 404) {
    console.error('Email template not found');
  }
}
```

### Rate Limiting

```typescript
try {
  await client.track('user123', 'event_name', { ... });
} catch (error) {
  if (error.response?.status === 429) {
    console.error('Rate limit exceeded - retry later');
    // Implement exponential backoff
  }
}
```

### Validation Failures

```typescript
try {
  await client.sendEmail({
    to: 'invalid-email',
    identifiers: { id: 'user123' },
    transactional_message_id: 'WELCOME'
  });
} catch (error) {
  if (error.message.includes('Invalid email address format')) {
    console.error('Email validation failed');
  }
}
```

### Timeout

```typescript
try {
  await client.identify('user123', { email: 'user@example.com' });
} catch (error) {
  if (error.code === 'ECONNABORTED') {
    console.error('Request timed out');
    // Retry or queue for later
  }
}
```

## Error Handling Patterns

### Basic Try-Catch

```typescript
try {
  await client.identify('user123', {
    email: 'user@example.com',
    name: 'John Doe'
  });
  console.log('User identified successfully');
} catch (error) {
  console.error('Failed to identify user:', error.message);
}
```

### Comprehensive Error Handler

```typescript
async function identifyUser(userId: string, properties: Record<string, any>) {
  try {
    await client.identify(userId, properties);
    return { success: true };
  } catch (error) {
    // Log error with context
    logger.error('Failed to identify user', {
      userId,
      error: error.message,
      status: error.response?.status,
      stack: error.stack
    });
    
    // Handle specific errors
    if (error.message.includes('Identifier cannot be empty')) {
      return { success: false, error: 'Invalid user ID' };
    }
    
    if (error.response?.status === 401) {
      return { success: false, error: 'Authentication failed' };
    }
    
    if (error.response?.status === 429) {
      return { success: false, error: 'Rate limit exceeded', retryable: true };
    }
    
    if (error.code === 'ECONNABORTED') {
      return { success: false, error: 'Request timeout', retryable: true };
    }
    
    // Generic error
    return { success: false, error: 'Failed to identify user' };
  }
}
```

### Fire and Forget with Error Logging

For non-critical operations:

```typescript
// Don't block on the operation
client.track('user123', 'page_viewed', { page: '/home' })
  .catch(error => {
    logger.error('Failed to track event', {
      userId: 'user123',
      event: 'page_viewed',
      error: error.message
    });
  });

// Continue immediately
res.render('home');
```

### Retry Logic

```typescript
async function identifyWithRetry(
  userId: string,
  properties: Record<string, any>,
  maxRetries = 3
) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await client.identify(userId, properties);
      return { success: true };
    } catch (error) {
      lastError = error;
      
      // Don't retry validation errors
      if (error.message.includes('cannot be empty') ||
          error.message.includes('Invalid')) {
        throw error;
      }
      
      // Don't retry auth errors
      if (error.response?.status === 401) {
        throw error;
      }
      
      // Retry on timeout or 5xx errors
      const shouldRetry = 
        error.code === 'ECONNABORTED' ||
        error.response?.status >= 500 ||
        error.response?.status === 429;
      
      if (!shouldRetry || attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      logger.warn(`Retrying identify (attempt ${attempt + 1}/${maxRetries})`);
    }
  }
  
  throw lastError;
}
```

### Graceful Degradation

Continue operation even if OpenCDP call fails:

```typescript
app.post('/api/signup', async (req, res) => {
  const { email, name } = req.body;
  
  try {
    // Critical: Create user in database
    const user = await db.users.create({ email, name });
    
    // Non-critical: Identify in CDP
    try {
      await client.identify(user.id, { email, name });
    } catch (cdpError) {
      // Log but don't fail the signup
      logger.error('OpenCDP identify failed during signup', {
        userId: user.id,
        error: cdpError.message
      });
      
      // Queue for retry
      await retryQueue.add('identify', {
        userId: user.id,
        properties: { email, name }
      });
    }
    
    res.json({ success: true, userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Signup failed' });
  }
});
```

### Circuit Breaker

Prevent cascading failures:

```typescript
import CircuitBreaker from 'opossum';

const identifyBreaker = new CircuitBreaker(
  (userId: string, properties: Record<string, any>) => 
    client.identify(userId, properties),
  {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000
  }
);

identifyBreaker.fallback(() => {
  logger.warn('Circuit breaker open - skipping identify');
  return { success: false, circuitOpen: true };
});

identifyBreaker.on('open', () => {
  logger.error('Circuit breaker opened for identify');
  alerting.notify('cdp_circuit_open');
});

// Use the circuit breaker
try {
  await identifyBreaker.fire('user123', { email: 'user@example.com' });
} catch (error) {
  console.error('Identify failed:', error);
}
```

## Logging Best Practices

### Structured Logging

```typescript
import pino from 'pino';

const logger = pino();

try {
  await client.sendEmail({
    to: 'user@example.com',
    identifiers: { id: 'user123' },
    transactional_message_id: 'WELCOME'
  });
  
  logger.info({
    event: 'email_sent',
    userId: 'user123',
    template: 'WELCOME',
    to: 'user@example.com'
  });
} catch (error) {
  logger.error({
    event: 'email_send_failed',
    userId: 'user123',
    template: 'WELCOME',
    to: 'user@example.com',
    error: error.message,
    status: error.status,
    code: error.code
  });
}
```

### Custom Logger Integration

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  cdpLogger: {
    debug: (msg) => logger.debug(msg),
    error: (msg, ctx) => {
      logger.error(ctx, msg);
      
      // Send to error tracking
      if (ctx?.status >= 500) {
        Sentry.captureMessage(msg, {
          level: 'error',
          extra: ctx
        });
      }
    },
    warn: (msg) => logger.warn(msg)
  }
});
```

## Monitoring and Alerting

### Track Error Rates

```typescript
import { metrics } from './monitoring';

async function trackWithMetrics(
  userId: string,
  eventName: string,
  properties: Record<string, any>
) {
  const startTime = Date.now();
  
  try {
    await client.track(userId, eventName, properties);
    
    metrics.increment('cdp.track.success');
    metrics.timing('cdp.track.duration', Date.now() - startTime);
  } catch (error) {
    metrics.increment('cdp.track.error');
    metrics.increment(`cdp.track.error.${error.response?.status || 'unknown'}`);
    
    // Alert on high error rates
    const errorRate = await metrics.getRate('cdp.track.error');
    if (errorRate > 0.05) { // 5% error rate
      alerting.notify('high_cdp_error_rate', { rate: errorRate });
    }
    
    throw error;
  }
}
```

### Error Tracking Integration

```typescript
import * as Sentry from '@sentry/node';

async function sendEmailWithTracking(emailRequest: SendEmailRequest) {
  try {
    const result = await client.sendEmail(emailRequest);
    return { success: true, result };
  } catch (error) {
    // Capture in Sentry
    Sentry.captureException(error, {
      tags: {
        operation: 'send_email',
        template: emailRequest.message.transactional_message_id
      },
      extra: {
        to: emailRequest.message.to,
        identifiers: emailRequest.message.identifiers,
        status: error.status,
        code: error.code
      }
    });
    
    return { success: false, error: error.message };
  }
}
```

## Testing Error Scenarios

### Unit Tests

```typescript
import { CDPClient } from '@codematic.io/cdp-node';
import nock from 'nock';

describe('CDPClient Error Handling', () => {
  let client: CDPClient;
  
  beforeEach(() => {
    client = new CDPClient({
      cdpApiKey: 'test-key',
      cdpEndpoint: 'https://api.test.com'
    });
  });
  
  test('throws validation error for empty identifier', async () => {
    await expect(
      client.identify('', { email: 'user@example.com' })
    ).rejects.toThrow('Identifier cannot be empty');
  });
  
  test('handles 401 authentication error', async () => {
    nock('https://api.test.com')
      .post('/v1/persons/identify')
      .reply(401, { error: 'Invalid API key' });
    
    await expect(
      client.identify('user123', { email: 'user@example.com' })
    ).rejects.toMatchObject({
      response: {
        status: 401
      }
    });
  });
  
  test('handles network timeout', async () => {
    nock('https://api.test.com')
      .post('/v1/persons/identify')
      .delayConnection(11000) // Longer than timeout
      .reply(200);
    
    await expect(
      client.identify('user123', { email: 'user@example.com' })
    ).rejects.toMatchObject({
      code: 'ECONNABORTED'
    });
  });
});
```

## Debug Mode

Enable debug mode to see detailed error information:

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  debug: true // See all errors with stack traces
});

try {
  await client.identify('user123', { email: 'user@example.com' });
} catch (error) {
  // Debug mode logs detailed error info automatically
  console.error('Operation failed');
}
```

## Related

- [API Reference](../api/client.md)
- [Best Practices](./best-practices.md)
- [Troubleshooting](../troubleshooting.md)

