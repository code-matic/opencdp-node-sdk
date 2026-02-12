---
sidebar_position: 6
---

# sendSms()

Sends a transactional SMS via the OpenCDP SMS service.

## Signature

```typescript
async sendSms(request: SendSmsRequest): Promise<any>
```

## Parameters

### request

- **Type:** `SendSmsRequest`
- **Required:** Yes
- **Description:** SMS configuration object

The request can be either **template-based** (using a transactional message ID) or **raw** (providing message body directly).

## Returns

`Promise<any>` - Response from the API containing the SMS delivery status.

## Throws

- **CDPSmsError**: Custom error with details about the failure
- **Validation errors**: If required fields are missing or invalid

## SMS Types

### Template-Based SMS

Use a predefined SMS template from your OpenCDP workspace:

```typescript
await client.sendSms({
  identifiers: { id: 'user123' },
  transactional_message_id: 'ORDER_CONFIRMATION',
  message_data: {
    order_number: '12345',
    total: '$99.99'
  }
});
```

### Raw SMS

Send custom SMS without a template:

```typescript
await client.sendSms({
  identifiers: { id: 'user123' },
  to: '+1234567890',
  body: 'Your order #12345 has been confirmed. Total: $99.99'
});
```

## Required Fields

### For All SMS

- `identifiers` - User identifier (must contain exactly one of: `id`, `email`, or `cdp_id`)

### Additional Requirements for Raw SMS

When **NOT** using `transactional_message_id`, you must also provide:

- `body` - SMS message content

### Phone Number (`to` field)

The `to` field is **optional** for both template-based and raw SMS. If not provided, the system will look up the phone number from the user's profile using the `identifiers`. 

You should provide `to` when:
- You want to override the phone number stored in the user's profile
- The user's profile doesn't have a phone number
- You're sending to a different phone number than what's on file

## Request Options

### SendSmsRequestWithTemplate

Template-based SMS with optional overrides:

```typescript
interface SendSmsRequestWithTemplate {
  // Required
  identifiers: { id: string } | { email: string } | { cdp_id: string };
  transactional_message_id: string | number;
  
  // Optional
  to?: string;                    // Phone number (E.164 format). If omitted, phone number is looked up from user profile
  from?: string;                   // Sender phone number (E.164 format)
  body?: string;                   // Override template body
  message_data?: Record<string, any>;
}
```

### SendSmsRequestWithoutTemplate

Raw SMS without a template:

```typescript
interface SendSmsRequestWithoutTemplate {
  // Required
  identifiers: { id: string } | { email: string } | { cdp_id: string };
  body: string;
  
  // Optional
  to?: string;                    // Phone number (E.164 format). If omitted, phone number is looked up from user profile
  from?: string;                   // Sender phone number (E.164 format)
  message_data?: Record<string, any>;
}
```

## Usage Examples

### Order Confirmation (Template)

```typescript
await client.sendSms({
  identifiers: { id: 'user123' },
  transactional_message_id: 'ORDER_CONFIRMATION',
  message_data: {
    order_number: 'ORD-12345',
    total: '$99.99',
    estimated_delivery: '2025-11-05'
  }
});
```

### Two-Factor Authentication (Raw SMS)

```typescript
// With explicit phone number
await client.sendSms({
  identifiers: { id: 'user123' },
  to: '+1234567890',
  body: 'Your verification code is 123456. Valid for 10 minutes.'
});

// Without phone number (looked up from user profile)
await client.sendSms({
  identifiers: { id: 'user123' },
  body: 'Your verification code is 123456. Valid for 10 minutes.'
});
```

### Appointment Reminder (Template with Override)

```typescript
await client.sendSms({
  identifiers: { id: 'user123' },
  transactional_message_id: 'APPOINTMENT_REMINDER',
  body: 'Reminder: Your appointment is tomorrow at 2 PM',
  message_data: {
    appointment_date: '2025-11-02',
    appointment_time: '14:00',
    location: '123 Main St'
  }
});
```

## Phone Number Format

Phone numbers must be in **E.164 format** (international format):

```typescript
// ✅ Valid formats
to: '+1234567890'      // US number
to: '+441234567890'    // UK number
to: '+33123456789'     // France number

// ❌ Invalid formats
to: '1234567890'       // Missing country code
to: '(123) 456-7890'   // Formatted number
to: '123-456-7890'     // Dashes not allowed
```

The SDK validates phone numbers and will throw an error if the format is invalid.

## Identifiers

You must provide exactly ONE of these identifier types:

```typescript
// Using internal user ID (recommended)
identifiers: { id: 'user123' }

// Using email address
identifiers: { email: 'user@example.com' }

// Using CDP ID
identifiers: { cdp_id: 'cdp_user_123' }
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

## Validation

The SDK validates your request before sending:

```typescript
// ❌ Error: identifiers is required
await client.sendSms({
  body: 'Test message'
});

// ❌ Error: body is required when not using a template
await client.sendSms({
  identifiers: { id: 'user123' }
});

// ❌ Error: Invalid phone number format
await client.sendSms({
  identifiers: { id: 'user123' },
  to: '1234567890',  // Missing + prefix
  body: 'Test'
});

// ❌ Error: body cannot be empty if provided
await client.sendSms({
  identifiers: { id: 'user123' },
  body: '   '  // Empty/whitespace only
});

// ✅ Valid template-based SMS
await client.sendSms({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_SMS'
});

// ✅ Valid raw SMS (with phone number)
await client.sendSms({
  identifiers: { id: 'user123' },
  to: '+1234567890',
  body: 'Your verification code is 123456'
});

// ✅ Valid raw SMS (phone number looked up from profile)
await client.sendSms({
  identifiers: { id: 'user123' },
  body: 'Your verification code is 123456'
});
```

## Error Handling

The SDK throws `CDPSmsError` with detailed information:

```typescript
try {
  const response = await client.sendSms({
    identifiers: { id: 'user123' },
    transactional_message_id: 'ORDER_CONFIRMATION',
    message_data: {
      order_number: '12345'
    }
  });
  
  console.log('SMS sent:', response);
} catch (error) {
  console.error('SMS send failed:', {
    name: error.name,           // 'CDPSmsError'
    code: error.code,           // 'SMS_SEND_FAILED'
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

## Dual-Write Behavior

:::info SMS requests NOT Forwarded to Customer.io
Unlike `identify()` and `track()`, SMS messages are **NOT** forwarded to Customer.io even when dual-write is enabled. This prevents duplicate messages.

If `sendToCustomerIo` is `true`, you'll see this warning:
```
[CDP] Warning: Transactional messaging SMS will NOT be sent to Customer.io 
to avoid sending twice. To turn this warning off set `sendToCustomerIo` to false.
```
:::

## Related

- [sendEmail()](./send-email.md) - Send emails
- [sendPush()](./send-push.md) - Send push notifications
- [identify()](./identify.md) - Identify users
- [SMS Examples](../examples/sms-notifications.md)
- [Error Handling Guide](../guides/error-handling.md)


