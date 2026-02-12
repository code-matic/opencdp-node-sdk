---
sidebar_position: 4
---

# sendEmail()

Sends a transactional email via the OpenCDP.

## Signature

```typescript
async sendEmail(request: SendEmailRequest): Promise<Record<string, any>>
```

## Parameters

### request

- **Type:** `SendEmailRequestOptions`
- **Required:** Yes
- **Description:** Email configuration object

The request can be either **template-based** (using a transactional message ID) or **raw** (providing HTML directly).

## Returns

`Promise<Record<string, any>>` - Response from the API containing the email delivery status.

## Throws

- **CDPEmailError**: Custom error with details about the failure
- **Validation errors**: If required fields are missing or invalid

## Email Types

### Template-Based Email

Use a predefined email template from your OpenCDP:

```typescript
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_EMAIL',
  message_data: {
    name: 'John',
    activation_link: 'https://example.com/activate/abc123'
  }
});
```

### Raw HTML Email

Send custom HTML without a template:

```typescript
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { email: 'user@example.com' },
  from: 'no-reply@example.com',
  subject: 'Welcome to Our Service',
  body: '<h1>Welcome!</h1><p>Thanks for signing up.</p>',
});
```

## Required Fields

### For All Emails

- `to` - Recipient email address
- `identifiers` - User identifier (must contain exactly one of: `id`, `email`, or `cdp_id`)

### Additional Requirements for Raw Emails

When **NOT** using `transactional_message_id`, you must also provide:

- `from` - Sender email address
- `subject` - Email subject line
- `body` - HTML body content

## Request Options

### SendEmailRequestWithTemplate

Template-based email with optional overrides:

```typescript
interface SendEmailRequestWithTemplate {
  // Required
  to: string;
  identifiers: { id: string } | { email: string };
  transactional_message_id: string | number;
  
  // Optional
  message_data?: Record<string, any>;
  subject?: string;           // Override template subject
  body?: string;              // Override template body
  plaintext_body?: string;    // Plain text version
  reply_to?: string;
  bcc?: string;
  preheader?: string;
  language?: string;
  
  // Advanced options (see Unsupported Fields section)
  headers?: Record<string, any>;
  send_at?: number;
  tracked?: boolean;
  // ... more options
}
```

### SendEmailRequestWithoutTemplate

Raw email without a template:

```typescript
interface SendEmailRequestWithoutTemplate {
  // Required
  to: string;
  identifiers: { id: string } | { email: string };
  from: string;
  subject: string;
  body: string;
  
  // Optional
  plaintext_body?: string;
  reply_to?: string;
  bcc?: string;
  preheader?: string;
  message_data?: Record<string, any>;
  // ... more options
}
```

## Usage Examples

### Welcome Email (Template)

```typescript
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_EMAIL',
  message_data: {
    name: 'John Doe',
    activation_url: 'https://app.example.com/activate'
  }
});
```

### Password Reset (Template with Override)

```typescript
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'PASSWORD_RESET',
  subject: 'Reset Your Password',  // Override template subject
  message_data: {
    reset_link: 'https://app.example.com/reset/token123',
    expiry_hours: 24
  }
});
```

### Order Confirmation (Raw HTML)

```typescript
await client.sendEmail({
  to: 'customer@example.com',
  identifiers: { email: 'customer@example.com' },
  from: 'orders@example.com',
  reply_to: 'support@example.com',
  subject: 'Order Confirmation #12345',
  body: `
    <html>
      <body>
        <h1>Order Confirmed!</h1>
        <p>Thank you for your order #12345</p>
        <p>Total: $99.99</p>
      </body>
    </html>
  `,
  body_plain: 'Order Confirmed! Thank you for your order #12345. Total: $99.99'
});
```

## Identifiers

You must provide exactly ONE of these identifier types:

```typescript
// Using internal user ID (recommended)
identifiers: { id: 'user123' }

// Using email address
identifiers: { email: 'user@example.com' }
```

:::tip Use Consistent Identifiers
The identifier must match the one used in `identify()`. See [Consistent Identifiers](../guides/best-practices.md#consistent-identifiers) for best practices.
:::

:::warning Single Identifier Only
You cannot provide multiple identifiers. The SDK will throw an error if you try.
:::

```typescript
// ❌ Error: Must contain exactly one identifier
identifiers: { 
  id: 'user123',
  email: 'user@example.com'
}

// ✅ Correct
identifiers: { id: 'user123' }
```

## Unsupported Fields Warning

Some fields are accepted by the API but **not yet processed** by the backend. The SDK will log a warning when you use them:

- `send_at` - Scheduled send time
- `send_to_unsubscribed` - Send to unsubscribed users
- `tracked` - Email tracking
- `disable_css_preprocessing` - CSS preprocessing control
- `headers` - Custom email headers
- `disable_message_retention` - Message retention control
- `queue_draft` - Queue as draft
- `attachments` - Email attachments
- `bcc` - BCC recipients
- `fake_bcc` - Fake BCC
- `reply_to` - Reply-to address
- `preheader` - Email preheader text

```typescript
// This will log a warning about unsupported fields
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'TEST',
  subject: 'Test Email',
  send_at: Math.floor(Date.now() / 1000) + 3600, // ⚠️ Warning logged
  tracked: true,                                   // ⚠️ Warning logged
  headers: { 'X-Custom-Header': 'value' }         // ⚠️ Warning logged
});
```

These fields are included for future compatibility but currently have **no effect** on email delivery.

## Validation

The SDK validates your request before sending:

```typescript
// ❌ Error: to is required
await client.sendEmail({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME'
});

// ❌ Error: Invalid email address format
await client.sendEmail({
  to: 'invalid-email',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME'
});

// ❌ Error: body is required when not using a template
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  from: 'sender@example.com',
  subject: 'Test'
  // Missing body!
});

// ✅ Valid template-based email
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME'
});

// ✅ Valid raw email
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  from: 'sender@example.com',
  subject: 'Test',
  body: '<p>Test email</p>'
});
```

## Error Handling

The SDK throws `CDPEmailError` with detailed information:

```typescript
try {
  const response = await client.sendEmail({
    to: 'user@example.com',
    identifiers: { id: 'user123' },
    transactional_message_id: 'WELCOME_EMAIL'
  });
  
  console.log('Email sent:', response);
} catch (error) {
  console.error('Email send failed:', {
    name: error.name,           // 'CDPEmailError'
    code: error.code,           // 'EMAIL_SEND_FAILED'
    message: error.message,     // Error description
    status: error.status,       // HTTP status code
    summary: error.summary      // Detailed error summary
  });
  
  // Handle specific errors
  if (error.status === 401) {
    console.error('Invalid API key');
  } else if (error.status === 404) {
    console.error('Template not found');
  } else if (error.status === 429) {
    console.error('Rate limit exceeded');
  }
}
```
<!-- 
## Real-World Examples

### Password Reset Flow

```typescript
async function sendPasswordReset(userId: string, email: string) {
  const token = generateResetToken();
  const resetUrl = `https://app.example.com/reset-password?token=${token}`;
  
  try {
    await client.sendEmail({
      to: email,
      identifiers: { id: userId },
      transactional_message_id: 'PASSWORD_RESET',
      message_data: {
        reset_url: resetUrl,
        expiry_minutes: 30
      }
    });
    
    // Track the event
    await client.track(userId, 'password_reset_email_sent', {
      email
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset:', error);
    throw new Error('Failed to send password reset email');
  }
}
```

### Order Notification

```typescript
async function sendOrderConfirmation(order: Order) {
  try {
    await client.sendEmail({
      to: order.customerEmail,
      identifiers: { id: order.customerId },
      transactional_message_id: 'ORDER_CONFIRMATION',
      message_data: {
        order_number: order.number,
        order_date: order.createdAt.toISOString(),
        total: order.total.toFixed(2),
        currency: order.currency,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price.toFixed(2)
        })),
        shipping_address: order.shippingAddress,
        tracking_url: order.trackingUrl
      }
    });
  } catch (error) {
    console.error(`Failed to send order confirmation for ${order.number}:`, error);
    // Queue for retry
    await retryQueue.add('email', {
      type: 'order_confirmation',
      orderId: order.id
    });
  }
}
``` -->

## Dual-Write Behavior

:::info Email requests NOT Forwarded to Customer.io
Unlike `identify()` and `track()`, emails are **NOT** forwarded to Customer.io even when dual-write is enabled. This prevents duplicate emails.

If `sendToCustomerIo` is `true`, you'll see this warning:
```
[CDP] Warning: Transactional messaging email will NOT be sent to Customer.io 
to avoid sending twice. To turn this warning off set `sendToCustomerIo` to false.
```
:::

## Using SendEmailRequest Class

For advanced use cases, you can use the `SendEmailRequest` class:

```typescript
import { SendEmailRequest } from '@codematic.io/cdp-node';

const request = new SendEmailRequest({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME',
  message_data: { name: 'John' }
});

// Add attachment (note: attachments are not yet supported by backend)
request.attach('invoice.pdf', pdfBuffer);

await client.sendEmail(request);
```
<!-- 
## Best Practices

### 1. Always Provide Plain Text

```typescript
// ✅ Good - Include plain text version
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  from: 'no-reply@example.com',
  subject: 'Welcome',
  body: '<h1>Welcome!</h1><p>Thanks for joining.</p>',
  body_plain: 'Welcome! Thanks for joining.'
});
```

### 2. Use Reply-To for Better UX

```typescript
// ✅ Good - Allow users to reply
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  from: 'no-reply@example.com',
  reply_to: 'support@example.com',
  subject: 'Welcome',
  body: '<p>Need help? Just reply to this email.</p>'
});
```

### 3. Track Email Events

```typescript
try {
  await client.sendEmail({ ... });
  
  await client.track(userId, 'email_sent', {
    email_type: 'welcome',
    template_id: 'WELCOME_EMAIL'
  });
} catch (error) {
  await client.track(userId, 'email_send_failed', {
    email_type: 'welcome',
    error: error.message
  });
}
``` -->

## Related

- [sendPush()](./send-push.md) - Send push notifications
- [sendSms()](./send-sms.md) - Send SMS messages
- [identify()](./identify.md) - Identify users
- [Email Examples](../examples/email-templates.md)
- [Error Handling Guide](../guides/error-handling.md)

