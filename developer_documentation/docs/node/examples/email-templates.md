---
sidebar_position: 2
---

# Email Template Examples

Examples of sending emails using templates and raw HTML.

## Welcome Email

```typescript
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_EMAIL',
  message_data: {
    name: 'John Doe',
    activation_link: 'https://app.example.com/activate/abc123'
  }
});
```

## Password Reset

```typescript
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'PASSWORD_RESET',
  message_data: {
    reset_link: 'https://app.example.com/reset/token123',
    expiry_minutes: 30,
    requested_at: new Date().toISOString()
  }
});
```

## Order Confirmation

```typescript
await client.sendEmail({
  to: 'customer@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'ORDER_CONFIRMATION',
  message_data: {
    order_number: 'ORD-12345',
    order_date: new Date().toISOString(),
    total: '99.99',
    currency: 'USD',
    items: [
      { name: 'Product 1', quantity: 2, price: '49.99' },
      { name: 'Product 2', quantity: 1, price: '49.99' }
    ],
    shipping_address: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102'
    },
    tracking_url: 'https://track.example.com/ORD-12345'
  }
});
```

## Invoice Email

```typescript
await client.sendEmail({
  to: 'customer@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'INVOICE',
  bcc: 'accounting@example.com',
  message_data: {
    invoice_number: 'INV-2025-001',
    invoice_date: '2025-10-29',
    due_date: '2025-11-29',
    amount_due: '499.00',
    currency: 'USD',
    line_items: [
      { description: 'Professional Plan', amount: '499.00' }
    ],
    payment_url: 'https://app.example.com/invoices/INV-2025-001/pay'
  }
});
```

## Raw HTML Email

```typescript
await client.sendEmail({
  to: 'user@example.com',
  identifiers: { email: 'user@example.com' },
  from: 'no-reply@example.com',
  reply_to: 'support@example.com',
  subject: 'Your Monthly Report',
  body: `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .header { background-color: #4CAF50; color: white; padding: 20px; }
          .content { padding: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Monthly Report</h1>
        </div>
        <div class="content">
          <p>Hello!</p>
          <p>Here's your monthly report...</p>
        </div>
      </body>
    </html>
  `,
  body_plain: 'Hello! Here\'s your monthly report...'
});
```

<!-- ## Multi-Language Support

```typescript
async function sendWelcomeEmail(userId: string, email: string, locale: string) {
  const templateMap = {
    'en': 'WELCOME_EMAIL_EN',
    'es': 'WELCOME_EMAIL_ES',
    'fr': 'WELCOME_EMAIL_FR'
  };
  
  await client.sendEmail({
    to: email,
    identifiers: { id: userId },
    transactional_message_id: templateMap[locale] || templateMap['en'],
    language: locale,
    message_data: {
      name: await getUserName(userId)
    }
  });
}
``` -->

## Related

- [sendEmail API](../api/send-email.md)
- [Basic Usage](./basic-usage.md)

