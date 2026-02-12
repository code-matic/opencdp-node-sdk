# @codematic/cdp-node

A Node.js client library for Codematic's Customer Data Platform (CDP) with optional Customer.io integration.

See the [CDP Documentation](https://docs.opencdp.io/) for more information.
## Installation

```bash
npm install @codematic.io/cdp-node
# or
yarn add @codematic.io/cdp-node
```

### Package Variants

This SDK is available in two npm packages:

- **`@codematic.io/cdp-node`** (recommended) - Scoped package for production use
- **`cdp-node`** - Unscoped package for legacy compatibility

Both packages contain identical functionality. Use the scoped version for new projects.

### Features

- Send customer identification and event data to Codematic CDP
- Send transactional emails (transactional messaging and raw HTML)
- Send SMS messages
- Send push notifications
- Optional dual-write capability to Customer.io
- TypeScript support 
- Simple error handling and logging

### Usage

```typescript
import { CDPClient } from '@codematic.io/cdp-node';

const client = new CDPClient({
  cdpApiKey: 'your-cdp-api-key'
});

// Identify a user
await client.identify('user123', {
  email: 'user@example.com',
  name: 'John Doe',
  plan: 'premium'
});

// Track an event
await client.track('user123', 'purchase_completed', {
  amount: 99.99,
  item_id: 'prod-123'
});

// Send transactional email
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_EMAIL',
  subject: 'Welcome!',
  body: 'Thank you for joining us!'
});

// Send push notification
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_PUSH',
  title: 'Welcome!',
  body: 'Thank you for joining us!'
});

// Send SMS
await client.sendSms({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_SMS',
  body: 'Thank you for joining us!'
});
```

### Dual-write to Customer.io

```typescript
const client = new CDPClient({
  cdpApiKey: 'your-cdp-api-key',
  sendToCustomerIo: true,
  customerIo: {
    siteId: 'your-customer-io-site-id',
    apiKey: 'your-customer-io-api-key',
    region: 'us' // or 'eu' for EU data centers
  }
});

// Now all identify, track, and update calls will send data to both platforms
```

### Sending Emails

The SDK supports both transactional messaging and raw email sending:

#### Transactional messaging Email (without body override)
```typescript
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_EMAIL',
  message_data: { name: 'John' }
});
```

#### Transactional messaging Email (with body and subject override)
```typescript
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_EMAIL',
  subject: 'Welcome!',
  body: 'Thank you for joining us!',
  message_data: { name: 'John' }
});
```

#### Raw Email (without transactional message id)
```typescript
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { email: 'user@example.com' },
  from: 'no-reply@aellacredit.com',
  subject: 'Raw Email Test',
  body: '<h1>This is a raw HTML email</h1>',
  body_plain: 'This is a plain text email',
  reply_to: 'support@aellacredit.com'
});
```

#### Unsupported Fields Warning

Some fields are accepted by the API but not yet processed by the backend. When you use these fields, the SDK will log a warning:

- `send_at` - Scheduled send time
- `send_to_unsubscribed` - Send to unsubscribed users
- `tracked` - Email tracking
- `disable_css_preprocessing` - CSS preprocessing control
- `headers` - Custom email headers
- `disable_message_retention` - Message retention control
- `queue_draft` - Queue as draft
- `attachments` - Email attachments

```typescript
// This will log a warning about unsupported fields
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'TEST',
  subject: 'Test',
  send_at: 1640995200, // ⚠️ Will log warning
  tracked: true,        // ⚠️ Will log warning
  headers: JSON.stringify({ 'X-Custom': 'value' }) // ⚠️ Will log warning
});
```

These fields are included for future compatibility but currently have no effect on email delivery.

### Sending Push Notifications

The SDK supports sending push notifications using transactional message templates:

#### Basic Push Notification
```typescript
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_PUSH',
  title: 'Welcome!',
  body: 'Thank you for joining us!'
});
```

#### Push Notification with Message Data
```typescript
await client.sendPush({
  identifiers: { email: 'user@example.com' },
  transactional_message_id: 'ORDER_UPDATE',
  message_data: {
    order_id: '12345',
    tracking_number: 'TRK123456',
    items: [
      { name: 'Shoes', price: '59.99' }
    ]
  }
});
```

#### Push Notification with Customer.io ID
```typescript
await client.sendPush({
  identifiers: { cdp_id: 'cio-123' },
  transactional_message_id: 'PROMOTION',
  title: 'Special Offer!',
  body: 'Get 20% off your next purchase'
});
```

### Sending SMS

The SDK supports both transactional messaging and raw SMS sending:

#### Transactional messaging SMS (without body override)
```typescript
await client.sendSms({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_SMS',
  message_data: { name: 'John' }
});
```

#### Transactional messaging SMS (with body override)
```typescript
await client.sendSms({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_SMS',
  body: 'Thank you for joining us!',
  message_data: { name: 'John' }
});
```

#### Raw SMS (without transactional message id)
```typescript
await client.sendSms({
  identifiers: { id: 'user123' },
  to: '+1234567890',
  from: '+1987654321',
  body: 'This is a raw SMS message'
});
```

### Constructor options
```typescript
interface CDPConfig {
  // Required OpenCDP configuration
  cdpApiKey: string;
  cdpEndpoint?: string; // Optional custom endpoint

  // Optional Customer.io configuration
  sendToCustomerIo?: boolean;
  customerIo?: {
    siteId: string;
    apiKey: string;
    region?: 'us' | 'eu';
  };

  // Logging options
  debug?: boolean;
  cdpLogger?: Logger; // Custom logger. will default to console.log
}
```

## Development

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test`
5. Submit a pull request

### Deployment

For information about deploying this SDK to npm, see [DEPLOYMENT.md](./DEPLOYMENT.md).

This SDK is published to two npm packages:
- `@codematic.io/cdp-node` (scoped, recommended)
- `cdp-node` (unscoped, legacy)

## License

MIT# opencdp-node-sdk
