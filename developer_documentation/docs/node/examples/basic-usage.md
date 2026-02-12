---
sidebar_position: 1
---

# Basic Usage Examples

Common usage patterns for the OpenCDP Node SDK.

## User Signup Flow

Complete signup flow with identification and welcome email:

```typescript
import { CDPClient } from '@codematic.io/cdp-node';

const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY
});

async function handleUserSignup(email: string, name: string) {
  try {
    // 1. Create user in your database
    const user = await db.users.create({
      email,
      name,
      createdAt: new Date()
    });
    
    // 2. Identify in CDP
    await client.identify(user.id, {
      email: user.email,
      name: user.name,
      created_at: user.createdAt.toISOString(),
      source: 'web_signup'
    });
    
    // 3. Track signup event
    await client.track(user.id, 'user_signed_up', {
      source: 'web',
      plan: 'free'
    });
    
    // 4. Send welcome email
    await client.sendEmail({
      to: user.email,
      identifiers: { id: user.id },
      transactional_message_id: 'WELCOME_EMAIL',
      message_data: {
        name: user.name,
        activation_link: `https://app.example.com/activate/${user.activationToken}`
      }
    });
    
    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}
```
<!-- 
## E-commerce Purchase Flow

Track purchase and send confirmation:

```typescript
async function handlePurchase(userId: string, order: Order) {
  try {
    // 1. Track purchase event
    await client.track(userId, 'purchase_completed', {
      order_id: order.id,
      amount: order.total,
      currency: order.currency,
      item_count: order.items.length,
      payment_method: order.paymentMethod
    });
    
    // 2. Update user attributes
    await client.identify(userId, {
      last_purchase_at: new Date().toISOString(),
      total_spent: order.userLifetimeValue,
      purchase_count: order.userPurchaseCount
    });
    
    // 3. Send order confirmation email
    await client.sendEmail({
      to: order.customerEmail,
      identifiers: { id: userId },
      transactional_message_id: 'ORDER_CONFIRMATION',
      message_data: {
        order_number: order.number,
        total: order.total.toFixed(2),
        currency: order.currency,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price.toFixed(2)
        })),
        tracking_url: order.trackingUrl
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Purchase tracking error:', error);
    // Don't fail the purchase if OpenCDP fails
    return { success: false, error: error.message };
  }
}
```

## User Activity Tracking

Track user activity throughout the app:

```typescript
import express from 'express';

const app = express();

// Middleware to track page views
app.use((req, res, next) => {
  if (req.user) {
    client.track(req.user.id, 'page_viewed', {
      path: req.path,
      method: req.method,
      user_agent: req.get('user-agent'),
      referrer: req.get('referrer')
    }).catch(err => console.error('Track error:', err));
  }
  next();
});

// Track feature usage
app.post('/api/export', async (req, res) => {
  const { format } = req.body;
  
  try {
    const file = await generateExport(req.user.id, format);
    
    // Track the feature usage
    await client.track(req.user.id, 'feature_used', {
      feature: 'export_data',
      format,
      file_size: file.size
    });
    
    res.download(file.path);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Subscription Management

Handle subscription lifecycle:

```typescript
async function handleSubscriptionCreated(userId: string, subscription: Subscription) {
  await client.identify(userId, {
    plan: subscription.plan,
    billing_cycle: subscription.billingCycle,
    subscription_status: 'active',
    subscribed_at: new Date().toISOString()
  });
  
  await client.track(userId, 'subscription_created', {
    plan: subscription.plan,
    amount: subscription.amount,
    billing_cycle: subscription.billingCycle
  });
  
  await client.sendEmail({
    to: subscription.customerEmail,
    identifiers: { id: userId },
    transactional_message_id: 'SUBSCRIPTION_CONFIRMED',
    message_data: {
      plan_name: subscription.planName,
      amount: subscription.amount.toFixed(2),
      billing_date: subscription.nextBillingDate.toISOString()
    }
  });
}

async function handleSubscriptionCancelled(userId: string, subscription: Subscription, reason: string) {
  await client.identify(userId, {
    subscription_status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancellation_reason: reason
  });
  
  await client.track(userId, 'subscription_cancelled', {
    plan: subscription.plan,
    reason,
    active_days: subscription.activeDays
  });
  
  await client.sendEmail({
    to: subscription.customerEmail,
    identifiers: { id: userId },
    transactional_message_id: 'SUBSCRIPTION_CANCELLED',
    message_data: {
      plan_name: subscription.planName,
      cancellation_date: new Date().toISOString()
    }
  });
}
```

## Batch User Import

Import users in batches:

```typescript
async function importUsers(users: User[]) {
  const batchSize = 100;
  const batches = chunk(users, batchSize);
  
  for (const batch of batches) {
    try {
      await Promise.all(
        batch.map(user =>
          client.identify(user.id, {
            email: user.email,
            name: user.name,
            created_at: user.createdAt.toISOString(),
            imported: true,
            import_date: new Date().toISOString()
          })
        )
      );
      
      console.log(`Imported batch of ${batch.length} users`);
      
      // Rate limiting
      await sleep(1000);
    } catch (error) {
      console.error('Batch import error:', error);
    }
  }
}
```

## Background Job Processing

Process OpenCDP operations in background jobs:

```typescript
import Queue from 'bull';

const cdpQueue = new Queue('cdp-events', {
  redis: {
    host: 'localhost',
    port: 6379
  }
});

// Producer - Queue events
export async function queueIdentify(userId: string, properties: Record<string, any>) {
  await cdpQueue.add('identify', {
    userId,
    properties,
    timestamp: Date.now()
  });
}

export async function queueTrack(userId: string, event: string, properties: Record<string, any>) {
  await cdpQueue.add('track', {
    userId,
    event,
    properties,
    timestamp: Date.now()
  });
}

// Consumer - Process queue
cdpQueue.process('identify', async (job) => {
  const { userId, properties } = job.data;
  await client.identify(userId, properties);
});

cdpQueue.process('track', async (job) => {
  const { userId, event, properties } = job.data;
  await client.track(userId, event, properties);
});

// Error handling
cdpQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
  // Could re-queue or alert
});
```

## Testing Mode

Conditional OpenCDP behavior for testing:

```typescript
class CDPService {
  private client: CDPClient;
  private isTestMode: boolean;
  
  constructor() {
    this.isTestMode = process.env.NODE_ENV === 'test';
    
    this.client = new CDPClient({
      cdpApiKey: process.env.CDP_API_KEY!,
      debug: this.isTestMode
    });
  }
  
  async identify(userId: string, properties: Record<string, any>) {
    if (this.isTestMode) {
      console.log('TEST MODE: Would identify', { userId, properties });
      return;
    }
    
    await this.client.identify(userId, properties);
  }
  
  async track(userId: string, event: string, properties: Record<string, any>) {
    if (this.isTestMode) {
      console.log('TEST MODE: Would track', { userId, event, properties });
      return;
    }
    
    await this.client.track(userId, event, properties);
  }
}
``` -->

## Related

- [Email Templates](./email-templates.md)
- [Push Notifications](./push-notifications.md)
- [Bulk Operations](./bulk-operations.md)

