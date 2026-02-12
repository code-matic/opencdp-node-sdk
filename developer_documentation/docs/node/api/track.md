---
sidebar_position: 3
---

# track()

Tracks a custom event for a user.

## Signature

```typescript
async track(
  identifier: string,
  eventName: string,
  properties?: Record<string, any>
): Promise<void>
```

## Parameters

### identifier

- **Type:** `string`
- **Required:** Yes
- **Description:** Unique identifier for the user

Must match the identifier used in `identify()` calls.

### eventName

- **Type:** `string`
- **Required:** Yes
- **Description:** Name of the event to track

Use descriptive, consistent naming (e.g., `purchase_completed`, `page_viewed`, `button_clicked`).

### properties

- **Type:** `Record<string, any>`
- **Required:** No
- **Default:** `{}`
- **Description:** Additional data about the event

## Returns

`Promise<void>` - Resolves when the event is tracked successfully.

## Throws

- **Error**: If identifier or event name is empty
- **Network errors**: If the request fails

## Identifier Consistency

:::tip Use Consistent Identifiers
The `identifier` parameter must match the identifier used in `identify()`. See [Consistent Identifiers](../guides/best-practices.md#consistent-identifiers) for best practices.
:::

## Usage Examples

### Basic Event Tracking

```typescript
await client.track('user123', 'page_viewed', {
  page: '/pricing',
  referrer: '/home'
});
```

### Purchase Event

```typescript
await client.track('user123', 'purchase_completed', {
  order_id: 'order_789',
  amount: 99.99,
  currency: 'USD',
  items: [
    {
      product_id: 'prod_123',
      name: 'Premium Plan',
      price: 99.99,
      quantity: 1
    }
  ],
  payment_method: 'credit_card'
});
```

### Feature Usage

```typescript
await client.track('user123', 'feature_used', {
  feature_name: 'export_data',
  export_format: 'csv',
  file_size_bytes: 1024000,
  timestamp: new Date().toISOString()
});
```

### Button Click

```typescript
await client.track('user123', 'button_clicked', {
  button_id: 'cta_signup',
  page: '/home',
  campaign: 'summer_2025'
});
```

## Event Naming Best Practices
<!-- 
### Use Past Tense

```typescript
// ✅ Good
await client.track('user123', 'purchase_completed', { ... });
await client.track('user123', 'page_viewed', { ... });
await client.track('user123', 'email_sent', { ... });
``` -->

### Be Specific and Descriptive

```typescript
// ✅ Good
await client.track('user123', 'checkout_payment_failed', {
  error_code: 'insufficient_funds',
  payment_method: 'credit_card'
});

// ❌ Bad - Too vague
await client.track('user123', 'error', {
  type: 'payment'
});
```

## Validation

```typescript
// ❌ Throws: Identifier cannot be empty
await client.track('', 'purchase_completed', { amount: 99.99 });

// ❌ Throws: Event name cannot be empty
await client.track('user123', '', { amount: 99.99 });

// ✅ Valid
await client.track('user123', 'purchase_completed', { amount: 99.99 });

// ✅ Valid - Properties are optional
await client.track('user123', 'page_viewed');
```

## Error Handling

```typescript
try {
  await client.track('user123', 'purchase_completed', {
    amount: 99.99,
    currency: 'USD'
  });
  console.log('Event tracked successfully');
} catch (error) {
  if (error.message.includes('Identifier cannot be empty')) {
    console.error('Invalid user identifier');
  } else if (error.message.includes('Event name cannot be empty')) {
    console.error('Invalid event name');
  } else if (error.response?.status === 429) {
    console.error('Rate limit exceeded');
  } else {
    console.error('Failed to track event:', error.message);
  }
}
```

## Real-World Integration Examples

### Express.js Middleware

```typescript
import express from 'express';
import { CDPClient } from '@codematic.io/cdp-node';

const app = express();
const cdp = new CDPClient({ cdpApiKey: process.env.CDP_API_KEY });

// Track all page views
app.use((req, res, next) => {
  if (req.user) {
    cdp.track(req.user.id, 'page_viewed', {
      path: req.path,
      method: req.method,
      user_agent: req.get('user-agent'),
      ip: req.ip
    }).catch(err => console.error('Tracking error:', err));
  }
  next();
});
```

### Next.js API Route

```typescript
// pages/api/checkout.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { cdpClient } from '@/lib/cdp';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId, items, total } = req.body;
  
  try {
    // Process checkout
    const order = await processCheckout(items);
    
    // Track the event
    await cdpClient.track(userId, 'checkout_completed', {
      order_id: order.id,
      total,
      item_count: items.length,
      payment_method: 'stripe'
    });
    
    res.json({ success: true, orderId: order.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```
<!-- 
### Background Job

```typescript
// jobs/processSubscriptions.ts
import { cdpClient } from '@/lib/cdp';

async function processExpiringTrials() {
  const users = await db.users.findTrialsExpiringToday();
  
  for (const user of users) {
    try {
      // Send notification
      await sendEmail(user.email, 'trial_expiring');
      
      // Track the event
      await cdpClient.track(user.id, 'trial_expiring_notification_sent', {
        trial_end_date: user.trialEndDate.toISOString(),
        days_since_start: user.trialDurationDays
      });
    } catch (error) {
      console.error(`Failed for user ${user.id}:`, error);
    }
  }
}
```

## Batch Event Tracking

Track multiple events in parallel:

```typescript
const events = [
  { userId: 'user1', event: 'page_viewed', data: { page: '/home' } },
  { userId: 'user2', event: 'button_clicked', data: { button: 'signup' } },
  { userId: 'user3', event: 'feature_used', data: { feature: 'export' } }
];

// SDK automatically handles concurrency limiting
await Promise.all(
  events.map(e => 
    client.track(e.userId, e.event, e.data)
  )
);
``` -->

## Dual-Write Behavior

When dual-write is enabled, events are sent to both OpenCDP and Customer.io:

```typescript
const client = new CDPClient({
  cdpApiKey: 'your-cdp-key',
  sendToCustomerIo: true,
  customerIo: {
    siteId: 'your-site-id',
    apiKey: 'your-api-key'
  }
});

// Sends to both platforms
await client.track('user123', 'purchase_completed', {
  amount: 99.99
});
```
<!-- 
## Performance Tips

### 1. Fire and Forget for Non-Critical Events

```typescript
// For non-critical events, don't await
client.track('user123', 'page_viewed', { page: '/home' })
  .catch(err => console.error('Tracking error:', err));

// Continue immediately
res.render('home');
```

### 2. Batch Process in Background

```typescript
// Queue events and process in batches
const eventQueue = [];

function queueEvent(userId: string, event: string, data: any) {
  eventQueue.push({ userId, event, data });
}

// Process every 5 seconds
setInterval(async () => {
  const batch = eventQueue.splice(0, 100);
  
  await Promise.all(
    batch.map(e => client.track(e.userId, e.event, e.data))
  ).catch(err => console.error('Batch tracking error:', err));
}, 5000);
```

### 3. Use Concurrency Control

```typescript
// For high-volume scenarios, adjust concurrency
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  maxConcurrentRequests: 30 // Maximum allowed
});
``` -->

## Related

- [identify()](./identify.md) - Identify users
- [sendEmail()](./send-email.md) - Send transactional emails
- [Best Practices](../guides/best-practices.md)
- [Examples](../examples/basic-usage.md)

