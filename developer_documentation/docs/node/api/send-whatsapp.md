---
sidebar_position: 7
---

# sendWhatsApp()

Sends a transactional WhatsApp message via the OpenCDP WhatsApp service.

## Signature

```typescript
async sendWhatsApp(request: SendWhatsAppRequest): Promise<any>
```

## Parameters

### request

- **Type:** `SendWhatsAppRequest`
- **Required:** Yes
- **Description:** WhatsApp configuration object

WhatsApp sends use a saved transactional whose content type is WhatsApp. `transactional_message_id` is required.

## Returns

`Promise<any>` - The gateway's acknowledgement, including the transactional execution record (`data.id`). Keep the id if you need to trace a send later.

A successful response means the message was **accepted and queued**, not that it was delivered. Delivery runs asynchronously, so problems like a missing WhatsApp provider, no phone number on the user's profile, or Meta rejecting the template do not make this call fail. Track the outcome through message delivery events in OpenCDP.

When `failOnException` is `false` (the default), errors are logged and the promise resolves to `undefined`.

## Throws

Only when `failOnException` is `true`:

- **CDPWhatsAppError**: The gateway rejected the request or could not be reached. `error.status` is the HTTP status, or `undefined` when the request never reached the gateway (`error.summary.networkCode` holds the network error code).
- **Validation errors**: If required fields are missing or invalid

## Retries and failover

Sends are not idempotent. The SDK moves to a fallback gateway host only when the primary provably did not process the request: connection refused, DNS failure, or a Cloudflare error that means the gateway was never reached (521, 522, 523, 525, 526). A timeout, a 4xx or any other 5xx (including 502, 503 and 504) is returned to you without retrying, because the message may already have been queued. If you add your own retries, be aware they can deliver the message twice.

## Template-Based WhatsApp

Use a predefined WhatsApp transactional from your OpenCDP workspace:

```typescript
await client.sendWhatsApp({
  identifiers: { id: 'user123' },
  transactional_message_id: 'ORDER_CONFIRMATION',
  message_data: {
    order_number: '12345',
    total: '$99.99'
  }
});
```

Override the recipient and fill template slots:

```typescript
await client.sendWhatsApp({
  identifiers: { id: 'user123' },
  transactional_message_id: 'ORDER_CONFIRMATION',
  to: '+14155551234',
  template_variables: {
    header: { '1': 'Order update' },
    body: { '1': 'Jane', '2': '12345' },
    button: { '1': 'track-12345' }
  }
});
```

## Required Fields

- `identifiers` - User identifier (must contain exactly one of: `id`, `email`, or `cdp_id`)
- `transactional_message_id` - ID or trigger name of a WhatsApp transactional

### Phone Number (`to` field)

The `to` field is **optional**. If not provided, the system will look up the phone number from the user's profile using the `identifiers`.

You should provide `to` when:

- You want to override the phone number stored in the user's profile

Phone numbers must be in international format (for example, `+14155551234`).

## Optional Fields

### template_variables

Object with optional `header`, `body`, and `button` objects. Each one maps a template slot number (`'1'`, `'2'`, ...) to its value. Slot keys must be positional numbers, because parameters are sent to WhatsApp in slot order.

Values can use Liquid, for example `'{{customer.first_name}}'` or `'{{trigger.order_number}}'`.

:::warning Overriding replaces all saved variables
If you pass `template_variables`, it replaces the variables saved on the transactional **entirely**. Sending only `body` drops the saved `header` and `button` values, and WhatsApp rejects a template that is missing parameters. Pass every section the template needs, or omit `template_variables` to use the saved ones.
:::

### message_data

Object of merge data for the send. It is available in the transactional's template variables as `{{trigger.<key>}}`, so `message_data: { order_number: '12345' }` fills `{{trigger.order_number}}`.

## Dual-Write Behavior

:::info WhatsApp requests NOT Forwarded to Customer.io
Unlike `identify()` and `track()`, WhatsApp messages are **NOT** forwarded to Customer.io even when dual-write is enabled. This prevents duplicate messages.

If `sendToCustomerIo` is `true`, you'll see this warning:
```
[CDP] Warning: Transactional messaging WhatsApp will NOT be sent to Customer.io 
to avoid sending twice. To turn this warning off set `sendToCustomerIo` to false.
```
:::

## Related

- [sendEmail()](./send-email.md) - Send emails
- [sendPush()](./send-push.md) - Send push notifications
- [sendSms()](./send-sms.md) - Send SMS messages
- [WhatsApp Examples](../examples/whatsapp-notifications.md)
- [Error Handling Guide](../guides/error-handling.md)
