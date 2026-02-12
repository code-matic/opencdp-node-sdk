---
sidebar_position: 4
---

# SMS Notification Examples

Examples for sending SMS notifications.

## Order Confirmation (Template)

```typescript
await client.sendSms({
  identifiers: { id: 'user123' },
  transactional_message_id: 'ORDER_CONFIRMATION',
  message_data: {
    order_number: 'ORD-789',
    total: '$99.99',
    estimated_delivery: '2025-11-05',
    tracking_url: 'https://track.example.com/ORD-789'
  }
});
```

## Two-Factor Authentication (Raw SMS)

```typescript
const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

await client.sendSms({
  identifiers: { id: 'user123' },
  to: '+1234567890',
  body: `Your verification code is ${verificationCode}. Valid for 10 minutes.`
});
```

## Appointment Reminder (Template)

```typescript
await client.sendSms({
  identifiers: { id: 'user123' },
  transactional_message_id: 'APPOINTMENT_REMINDER',
  message_data: {
    appointment_date: '2025-11-02',
    appointment_time: '14:00',
    location: '123 Main St, Suite 100',
    doctor_name: 'Dr. Smith'
  }
});
```

## Delivery Notification (Raw SMS)

```typescript
await client.sendSms({
  identifiers: { id: 'user123' },
  to: '+1234567890',
  body: 'Your package has been delivered! Tracking: TRK123456. Reply STOP to unsubscribe.'
});
```

## Password Reset Code (Raw SMS)

```typescript
const resetCode = generateResetCode();

await client.sendSms({
  identifiers: { id: 'user123' },
  to: '+1234567890',
  body: `Your password reset code is ${resetCode}. This code expires in 15 minutes.`
});
```

## Related

- [sendSms API](../api/send-sms.md)
- [sendEmail API](../api/send-email.md)
- [sendPush API](../api/send-push.md)


