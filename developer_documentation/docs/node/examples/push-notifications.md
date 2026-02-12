---
sidebar_position: 3
---

# Push Notification Examples

Examples for sending push notifications.

## Order Status Update

```typescript
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'ORDER_SHIPPED',
  message_data: {
    order_id: 'ORD-789',
    tracking_number: 'TRK123456',
    carrier: 'FedEx',
    estimated_delivery: '2025-11-05',
    deep_link: '/orders/ORD-789'
  }
});
```

## New Message Notification

```typescript
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'NEW_MESSAGE',
  title: 'New message from Sarah',
  body: 'Hey! Are you free this weekend?',
  message_data: {
    sender_id: 'user456',
    sender_name: 'Sarah',
    message_id: 'msg_789',
    conversation_id: 'conv_123',
    deep_link: '/messages/conv_123'
  }
});
```
<!-- 
## Event Reminder

```typescript
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'EVENT_REMINDER',
  title: 'Meeting in 15 minutes',
  body: 'Team Sync - Conference Room A',
  message_data: {
    event_id: 'evt_456',
    start_time: '2025-10-29T14:00:00Z',
    location: 'Conference Room A',
    deep_link: '/calendar/evt_456'
  }
});
``` -->

## Related

- [sendPush API](../api/send-push.md)
- [registerDevice API](../api/register-device.md)

