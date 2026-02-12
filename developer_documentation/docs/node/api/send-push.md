---
sidebar_position: 5
---

# sendPush()

Sends a push notification to a user's registered device(s).

## Signature

```typescript
async sendPush(request: SendPushRequest): Promise<any>
```

## Parameters

### request

- **Type:** `SendPushRequest`
- **Required:** Yes
- **Description:** Push notification configuration

## Returns

`Promise<any>` - Response from the API containing delivery status.

## Throws

- **CDPPushError**: Custom error with details about the failure
- **Validation errors**: If required fields are missing or invalid

## SendPushRequest Interface

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

## Required Fields

- `identifiers` - User identifier (exactly one of: `id`, `email`)
- `transactional_message_id` - Template ID for the push notification


:::tip Use Consistent Identifiers
The identifier must match the one used in `identify()`. See [Consistent Identifiers](../guides/best-practices.md#consistent-identifiers) for best practices.
:::

## Usage Examples

### Basic Push Notification

```typescript
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_PUSH',
  title: 'Welcome!',
  body: 'Thank you for joining us!'
});
```

### Push with Message Data

```typescript
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'ORDER_UPDATE',
  message_data: {
    order_number: '12345',
    status: 'shipped',
    tracking_number: 'TRK789',
    estimated_delivery: '2025-11-02'
  }
});
```

### Using Email Identifier

```typescript
await client.sendPush({
  identifiers: { email: 'user@example.com' },
  transactional_message_id: 'PROMO_ALERT',
  title: 'Special Offer!',
  body: 'Get 20% off your next purchase'
});
```


## Identifiers

You must provide exactly ONE identifier type:

```typescript
// ✅ Valid - Using user ID
identifiers: { id: 'user123' }
```

:::tip Use Consistent Identifiers
The identifier must match the one used in `identify()`. See [Consistent Identifiers](../guides/best-practices.md#consistent-identifiers) for best practices.
:::

```typescript
// ❌ Error - Multiple identifiers
identifiers: {
  id: 'user123',
  email: 'user@example.com'
}

// ❌ Error - No identifier
identifiers: {}
```

## Validation

The SDK validates your request:

```typescript
// ❌ Error: identifiers is required
await client.sendPush({
  transactional_message_id: 'WELCOME'
});

// ❌ Error: transactional_message_id is required
await client.sendPush({
  identifiers: { id: 'user123' }
});

// ❌ Error: body cannot be empty if provided
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME',
  body: '   '  // Empty/whitespace only
});

// ✅ Valid - Minimal required fields
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME'
});

// ✅ Valid - With optional fields
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME',
  title: 'Welcome',
  body: 'Thanks for signing up!'
});
```

## Device Registration Required

:::warning Device Must Be Registered
Users must have at least one registered device to receive push notifications. 

See [registerDevice()](./register-device.md) for details on device registration.
:::

```typescript
// First, register a device
await client.registerDevice('user123', {
  deviceId: 'device_abc123',
  platform: 'ios',
  fcmToken: 'fcm_token_here',
  appVersion: '1.0.0'
});

// Then send push notifications
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_PUSH',
  title: 'Welcome!',
  body: 'Thanks for installing our app'
});
```

## Error Handling

The SDK throws `CDPPushError` with detailed information:

```typescript
try {
  const response = await client.sendPush({
    identifiers: { id: 'user123' },
    transactional_message_id: 'WELCOME_PUSH',
    title: 'Welcome!',
    body: 'Thank you for joining us!'
  });
  
  console.log('Push sent:', response);
} catch (error) {
  console.error('Push send failed:', {
    name: error.name,           // 'CDPPushError'
    code: error.code,           // 'PUSH_SEND_FAILED'
    message: error.message,     // Error description
    status: error.status,       // HTTP status code
    summary: error.summary      // Detailed error summary
  });
  
  // Handle specific errors
  if (error.status === 401) {
    console.error('Invalid API key');
  } else if (error.status === 404) {
    console.error('User or template not found');
  } else if (error.message.includes('No registered devices')) {
    console.error('User has no registered devices');
  }
}
```
<!-- 
## Real-World Examples

### Order Status Notifications

```typescript
async function notifyOrderShipped(orderId: string, userId: string) {
  const order = await db.orders.findById(orderId);
  
  try {
    await client.sendPush({
      identifiers: { id: userId },
      transactional_message_id: 'ORDER_SHIPPED',
      message_data: {
        order_number: order.number,
        tracking_number: order.trackingNumber,
        tracking_url: order.trackingUrl,
        carrier: order.carrier,
        estimated_delivery: order.estimatedDelivery.toISOString()
      }
    });
    
    // Track the notification
    await client.track(userId, 'push_notification_sent', {
      type: 'order_shipped',
      order_id: orderId
    });
  } catch (error) {
    console.error(`Failed to send push for order ${orderId}:`, error);
    // Queue for retry
    await retryQueue.add('push', {
      type: 'order_shipped',
      orderId,
      userId
    });
  }
}
```

### Chat Message Notification

```typescript
async function notifyNewMessage(recipientId: string, message: Message) {
  try {
    await client.sendPush({
      identifiers: { id: recipientId },
      transactional_message_id: 'NEW_CHAT_MESSAGE',
      title: `New message from ${message.senderName}`,
      body: truncate(message.content, 100),
      message_data: {
        sender_id: message.senderId,
        sender_name: message.senderName,
        message_id: message.id,
        conversation_id: message.conversationId,
        deep_link: `/chat/${message.conversationId}`
      }
    });
  } catch (error) {
    console.error('Failed to send chat notification:', error);
  }
}
```

### Reminder Notification

```typescript
async function sendEventReminder(userId: string, event: Event) {
  const minutesUntil = differenceInMinutes(event.startTime, new Date());
  
  try {
    await client.sendPush({
      identifiers: { id: userId },
      transactional_message_id: 'EVENT_REMINDER',
      title: `Event starting in ${minutesUntil} minutes`,
      body: event.title,
      message_data: {
        event_id: event.id,
        event_title: event.title,
        start_time: event.startTime.toISOString(),
        location: event.location,
        deep_link: `/events/${event.id}`
      }
    });
  } catch (error) {
    console.error('Failed to send event reminder:', error);
  }
}
```

### Background Job for Batch Notifications

```typescript
async function sendDailyDigest() {
  const users = await db.users.findActiveUsers();
  
  for (const user of users) {
    try {
      const unreadCount = await getUnreadCount(user.id);
      
      if (unreadCount > 0) {
        await client.sendPush({
          identifiers: { id: user.id },
          transactional_message_id: 'DAILY_DIGEST',
          title: `You have ${unreadCount} unread notifications`,
          body: 'Check out what you missed today',
          message_data: {
            unread_count: unreadCount,
            deep_link: '/notifications'
          }
        });
        
        // Rate limiting - don't overwhelm the system
        await sleep(100);
      }
    } catch (error) {
      console.error(`Failed to send digest to user ${user.id}:`, error);
    }
  }
}
```

## Deep Links

Include deep links in `message_data` to navigate users to specific screens:

```typescript
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'NEW_FOLLOWER',
  title: 'New Follower',
  body: 'Alice started following you',
  message_data: {
    follower_id: 'user456',
    follower_name: 'Alice',
    deep_link: '/profile/user456',  // Your app handles this
    
    // Platform-specific deep links
    ios_deep_link: 'myapp://profile/user456',
    android_deep_link: 'myapp://profile/user456',
    web_url: 'https://app.example.com/profile/user456'
  }
});
```

## Testing Push Notifications

### Test in Development

```typescript
if (process.env.NODE_ENV === 'development') {
  // Use a test template
  await client.sendPush({
    identifiers: { id: 'test_user' },
    transactional_message_id: 'TEST_PUSH',
    title: 'Test Notification',
    body: 'This is a test'
  });
}
```

### Test with Debug Mode

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  debug: true  // See detailed logs
});

await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_PUSH',
  title: 'Welcome',
  body: 'Thanks for joining'
});
``` -->

## Dual-Write Behavior

:::info Push NOT forwarded to Customer.io
Like emails, push notifications are **NOT** forwarded to Customer.io even when dual-write is enabled. This prevents duplicate notifications.

If `sendToCustomerIo` is `true`, you'll see this warning:
```
[CDP] Warning: Transactional messaging push will NOT be sent to Customer.io 
to avoid sending twice. To turn this warning off set `sendToCustomerIo` to false.
```
:::
<!-- 
## Best Practices

### 1. Keep Messages Concise

```typescript
// ✅ Good - Short and clear
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'NEW_MESSAGE',
  title: 'New message from Sarah',
  body: 'Hey! Are you free this weekend?'
});

// ❌ Bad - Too long
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'NEW_MESSAGE',
  title: 'You have received a new message in your inbox',
  body: 'Sarah has sent you a message asking about your weekend availability and...'
});
```

### 2. Include Actionable Information

```typescript
// ✅ Good - Clear call to action
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'ORDER_READY',
  title: 'Your order is ready!',
  body: 'Pick it up before 6 PM today',
  message_data: {
    deep_link: '/orders/123'
  }
});
```

### 3. Respect User Preferences

```typescript
async function sendPushIfAllowed(userId: string, notificationType: string) {
  const preferences = await getUserPreferences(userId);
  
  if (!preferences.push_enabled || 
      !preferences.notification_types.includes(notificationType)) {
    return; // Skip sending
  }
  
  await client.sendPush({
    identifiers: { id: userId },
    transactional_message_id: 'NOTIFICATION',
    title: 'Update',
    body: 'Something happened'
  });
}
```

### 4. Track Notification Success

```typescript
try {
  await client.sendPush({ ... });
  
  await client.track(userId, 'push_notification_sent', {
    notification_type: 'order_shipped',
    template_id: 'ORDER_SHIPPED'
  });
} catch (error) {
  await client.track(userId, 'push_notification_failed', {
    notification_type: 'order_shipped',
    error: error.message
  });
}
``` -->

## Related

- [registerDevice()](./register-device.md) - Register devices for push
- [sendEmail()](./send-email.md) - Send emails
- [sendSms()](./send-sms.md) - Send SMS messages
- [Push Examples](../examples/push-notifications.md)
- [Error Handling Guide](../guides/error-handling.md)

