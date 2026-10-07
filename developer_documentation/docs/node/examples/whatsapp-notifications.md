---
sidebar_position: 5
---

# WhatsApp Notification Examples

Examples for sending WhatsApp notifications.

## Order Confirmation

If the saved transactional already maps its slots to `{{trigger.order_number}}` and `{{trigger.total}}`, pass only `message_data`:

```typescript
await client.sendWhatsApp({
  identifiers: { id: 'user123' },
  transactional_message_id: 'ORDER_CONFIRMATION',
  message_data: {
    order_number: 'ORD-789',
    total: '$99.99'
  }
});
```

To set the slots from code instead, pass `template_variables`. This replaces all saved variables, so include every section the template uses:

```typescript
await client.sendWhatsApp({
  identifiers: { id: 'user123' },
  transactional_message_id: 'ORDER_CONFIRMATION',
  message_data: { order_number: 'ORD-789', total: '$99.99' },
  template_variables: {
    body: {
      '1': '{{customer.first_name}}',
      '2': '{{trigger.order_number}}',
      '3': '{{trigger.total}}'
    }
  }
});
```

A successful call means the message was queued, not delivered. See [sendWhatsApp](../api/send-whatsapp.md#returns).

## Phone Override

```typescript
await client.sendWhatsApp({
  identifiers: { email: 'user@example.com' },
  transactional_message_id: 'SHIPPING_UPDATE',
  to: '+14155551234',
  template_variables: {
    body: { '1': 'In transit' },
    button: { '1': 'track-ORD-789' }
  }
});
```

## Related

- [sendWhatsApp API](../api/send-whatsapp.md)
- [sendSms API](../api/send-sms.md)
- [sendEmail API](../api/send-email.md)
- [sendPush API](../api/send-push.md)
