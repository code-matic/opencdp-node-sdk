---
sidebar_position: 2
---

# Quick Start

Get up and running with the OpenCDP Node SDK in minutes.

## Initialize the Client

First, import and initialize the OpenCDP client with your API key:

```typescript
import { CDPClient } from '@codematic.io/cdp-node';

const client = new CDPClient({
  cdpApiKey: 'your-cdp-api-key'
});
```

:::tip Getting Your API Key
Contact your Codematic administrator to obtain your OpenCDP API key. Keep this key secure and never commit it to version control.
:::

## Identify a User

Identify a user and set their attributes:

```typescript
await client.identify('user123', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  plan: 'premium',
  created_at: new Date().toISOString()
});
```

The first parameter is the **user identifier** (typically your internal user ID), and the second parameter is an object containing any custom attributes you want to associate with the user.

:::tip Person Attributes
The OpenCDP automatically recognizes `firstName`/`first_name`, `lastName`/`last_name`, and `email` as special person attributes. See [Best Practices](../guides/best-practices.md#person-attributes) for details.
:::

## Track an Event

Track a custom event for a user:

```typescript
await client.track('user123', 'purchase_completed', {
  amount: 99.99,
  currency: 'USD',
  item_id: 'prod-123',
  item_name: 'Premium Subscription'
});
```

Events help you understand user behavior and trigger automated campaigns.

## Send a Transactional Email

Send an email using a predefined template:

```typescript
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_EMAIL',
  message_data: {
    name: 'John',
    activation_link: 'https://app.example.com/activate/xyz'
  }
});
```

Or send a raw HTML email:

```typescript
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { email: 'user@example.com' },
  from: 'no-reply@example.com',
  subject: 'Welcome to Our Service',
  body: '<h1>Welcome!</h1><p>Thank you for joining us.</p>'
});
```

## Send a Push Notification

Send a push notification to a user:

```typescript
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_PUSH',
  title: 'Welcome!',
  body: 'Thank you for joining us!',
  message_data: {
    name: 'John',
    deep_link: '/home'
  }
});
```

:::info Device Registration Required
Users must have a registered device to receive push notifications. See [Register Device](../api/register-device.md) for details.
:::

## Error Handling

Always wrap your OpenCDP calls in try-catch blocks:

```typescript
try {
  await client.identify('user123', {
    email: 'user@example.com'
  });
} catch (error) {
  console.error('Failed to identify user:', error.message);
  // Handle the error appropriately
}
```

## Complete Example

Here's a complete example of using the SDK in an Express.js application:

```typescript
import express from 'express';
import { CDPClient } from '@codematic.io/cdp-node';

const app = express();
const cdp = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  debug: process.env.NODE_ENV === 'development'
});

app.use(express.json());

app.post('/api/signup', async (req, res) => {
  const { email, name } = req.body;
  
  try {
    // Generate user ID
    const userId = generateUserId();
    
    // Identify the user
    await cdp.identify(userId, {
      email,
      name,
      created_at: new Date().toISOString()
    });
    
    // Track signup event
    await cdp.track(userId, 'user_signed_up', {
      source: 'web',
      plan: 'free'
    });
    
    // Send welcome email
    await cdp.sendEmail({
      to: email,
      identifiers: { id: userId },
      transactional_message_id: 'WELCOME_EMAIL',
      message_data: { name }
    });
    
    res.json({ success: true, userId });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to complete signup' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Next Steps

- Learn about [Configuration Options](./configuration.md)
- Explore the [API Reference](../api/client.md)
- Check out more [Examples](../examples/basic-usage.md)
- Read [Best Practices](../guides/best-practices.md)

