---
sidebar_position: 7
---

# Types Reference

TypeScript type definitions for the OpenCDP Node SDK.

## CDPConfig

Configuration options for the OpenCDP client.

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

### Properties

#### cdpApiKey (required)
- **Type:** `string`
- **Description:** Your OpenCDP API key for authentication

#### cdpEndpoint
- **Type:** `string`
- **Default:** `'https://api.opencdp.io/gateway/data-gateway'`
- **Description:** Custom endpoint URL for the OpenCDP API

#### cdpLogger
- **Type:** `Logger`
- **Description:** Custom logger implementation

#### maxConcurrentRequests
- **Type:** `number`
- **Default:** `10`
- **Maximum:** `30`
- **Description:** Maximum number of concurrent requests to the OpenCDP API

#### timeout
- **Type:** `number`
- **Default:** `10000` (10 seconds)
- **Description:** Request timeout in milliseconds

#### sendToCustomerIo
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Enable dual-write to Customer.io

#### customerIo
- **Type:** `object`
- **Description:** Customer.io credentials for dual-write mode
  - `siteId` (string, required): Customer.io site ID
  - `apiKey` (string, required): Customer.io API key
  - `region` ('us' | 'eu', optional): Data center region

#### debug
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Enable debug logging

---

## Logger

Custom logger interface for OpenCDP operations.

```typescript
interface Logger {
  debug(message: string): void;
  error(message: string, context?: Record<string, any>): void;
  warn(message: string): void;
}
```

### Example Implementation

```typescript
import pino from 'pino';

const logger = pino();

const cdpLogger: Logger = {
  debug: (msg) => logger.debug(msg),
  error: (msg, ctx) => logger.error(ctx, msg),
  warn: (msg) => logger.warn(msg)
};
```

---

## Identifiers

User identifier types for email and push operations.

```typescript
type Identifiers = 
  | { id: string | number }
  | { email: string };
```

### Usage

```typescript
// Using internal user ID
const identifiers: Identifiers = { id: 'user123' };

// Using email
const identifiers: Identifiers = { email: 'user@example.com' };
```

---

## SendEmailRequestOptions

Union type for email request options.

```typescript
type SendEmailRequestOptions = 
  | SendEmailRequestWithTemplate 
  | SendEmailRequestWithoutTemplate;
```

---

## SendEmailRequestWithTemplate

Email request using a transactional message template.

```typescript
interface SendEmailRequestWithTemplate {
  // Required
  to: string;
  identifiers: Identifiers;
  transactional_message_id: string | number;
  
  // Optional
  message_data?: Record<string, any>;
  subject?: string;
  body?: string;
  plaintext_body?: string;
  amp_body?: string;
  reply_to?: string;
  bcc?: string;
  preheader?: string;
  language?: string;
  headers?: Record<string, any>;
  
  // Advanced options
  fake_bcc?: boolean;
  disable_message_retention?: boolean;
  send_to_unsubscribed?: boolean;
  tracked?: boolean;
  queue_draft?: boolean;
  send_at?: number;
  disable_css_preprocessing?: boolean;
  attachments?: Record<string, string>;
}
```

### Example

```typescript
const request: SendEmailRequestWithTemplate = {
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_EMAIL',
  message_data: {
    name: 'John',
    activation_link: 'https://example.com/activate'
  }
};
```

---

## SendEmailRequestWithoutTemplate

Raw email request without a template.

```typescript
interface SendEmailRequestWithoutTemplate {
  // Required
  to: string;
  identifiers: Identifiers;
  from: string;
  subject: string;
  body: string;
  
  // Optional
  plaintext_body?: string;
  amp_body?: string;
  reply_to?: string;
  bcc?: string;
  preheader?: string;
  message_data?: Record<string, any>;
  headers?: Record<string, any>;
  
  // Advanced options
  fake_bcc?: boolean;
  disable_message_retention?: boolean;
  send_to_unsubscribed?: boolean;
  tracked?: boolean;
  queue_draft?: boolean;
  send_at?: number;
  disable_css_preprocessing?: boolean;
  language?: string;
  attachments?: Record<string, string>;
}
```

### Example

```typescript
const request: SendEmailRequestWithoutTemplate = {
  to: 'user@example.com',
  identifiers: { email: 'user@example.com' },
  from: 'no-reply@example.com',
  subject: 'Welcome',
  body: '<h1>Welcome!</h1>',
  plaintext_body: 'Welcome!'
};
```

---

## SendEmailRequest

Class for building email requests with attachments.

```typescript
class SendEmailRequest {
  message: Message;
  
  constructor(opts: SendEmailRequestOptions);
  
  attach(
    name: string, 
    data: any, 
    options?: { encode?: boolean }
  ): void;
}
```

### Usage

```typescript
import { SendEmailRequest } from '@codematic.io/cdp-node';

const request = new SendEmailRequest({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'INVOICE',
  message_data: { invoice_number: '12345' }
});

// Add attachment (note: not yet supported by backend)
request.attach('invoice.pdf', pdfBuffer);

await client.sendEmail(request);
```

---

## SendPushRequest

Push notification request parameters.

```typescript
interface SendPushRequest {
  // Required
  identifiers: {
    id?: string;
    email?: string;
    cdp_id?: string;
  };
  transactional_message_id: string | number;
  
  // Optional
  title?: string;
  body?: string;
  message_data?: Record<string, any>;
}
```

### Example

```typescript
const request: SendPushRequest = {
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_PUSH',
  title: 'Welcome!',
  body: 'Thank you for joining us!',
  message_data: {
    deep_link: '/home'
  }
};
```

---

## DeviceRegistrationParameters

Device registration parameters for push notifications.

```typescript
interface DeviceRegistrationParameters {
  // Required
  deviceId: string;
  platform: 'android' | 'ios' | 'web';
  fcmToken: string;
  
  // Optional
  name?: string;
  osVersion?: string;
  model?: string;
  apnToken?: string;
  appVersion?: string;
  last_active_at?: string;
  attributes?: Record<string, any>;
}
```

### Example

```typescript
const deviceParams: DeviceRegistrationParameters = {
  deviceId: 'device_abc123',
  platform: 'ios',
  fcmToken: 'fcm_token_here',
  osVersion: '17.0',
  model: 'iPhone 14 Pro',
  appVersion: '1.2.3',
  name: 'John\'s iPhone',
  attributes: {
    app_language: 'en',
    push_enabled: true
  }
};
```

---

## Error Types

### CDPEmailError

Custom error thrown by `sendEmail()`.

```typescript
interface CDPEmailError extends Error {
  name: 'CDPEmailError';
  code: 'EMAIL_SEND_FAILED';
  status: number;
  summary: {
    message: string;
    status?: number;
    data?: string;
  };
}
```

### CDPPushError

Custom error thrown by `sendPush()`.

```typescript
interface CDPPushError extends Error {
  name: 'CDPPushError';
  code: 'PUSH_SEND_FAILED';
  status: number;
  summary: {
    message: string;
    status?: number;
    data?: string;
  };
}
```
---

## Related

- [CDPClient](./client.md)
- [Configuration Guide](../getting-started/configuration.md)
- [Examples](../examples/basic-usage.md)

