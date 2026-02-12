---
sidebar_position: 2
---

# identify()

Identifies a user and updates their attributes in the CDP.

## Signature

```typescript
async identify(
  identifier: string,
  properties?: Record<string, any>
): Promise<void>
```

## Parameters

### identifier

- **Type:** `string`
- **Required:** Yes
- **Description:** Unique identifier for the user (typically your internal user ID)

The identifier must not be empty or whitespace-only.

### properties

- **Type:** `Record<string, any>`
- **Required:** No
- **Default:** `{}`
- **Description:** Custom attributes to associate with the user

Properties can include any JSON-serializable values:
- Strings, numbers, booleans
- Dates (as ISO strings)
- Nested objects
- Arrays

#### Person Attributes

The OpenCDP automatically recognizes `firstName`/`first_name`, `lastName`/`last_name`, and `email` as special person attributes. See [Person Attributes in Best Practices](../guides/best-practices.md#person-attributes) for details.

## Returns

`Promise<void>` - Resolves when the user is identified successfully.

## Throws

- **Error**: If the identifier is empty or invalid
- **Network errors**: If the request fails

## Behavior

The `identify()` method:

1. Validates the identifier
2. Normalizes the properties
3. Sends data to the OpenCDP
4. (If enabled) Also sends data to Customer.io for dual-write

## Usage Examples

### Basic Identification

```typescript
await client.identify('user123', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe'
});
```

### With Rich Attributes

```typescript
await client.identify('user123', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  plan: 'premium',
  created_at: new Date().toISOString(),
  age: 32,
  company: {
    name: 'Acme Inc',
    size: '50-100',
    industry: 'Technology'
  },
  tags: ['vip', 'early-adopter'],
  preferences: {
    newsletter: true,
    notifications: {
      email: true,
      push: false
    }
  }
});
```

### Update User Attributes

You can call `identify()` multiple times for the same user to update their attributes:

```typescript
// Initial identification
await client.identify('user123', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  plan: 'free'
});

// Later: upgrade to premium
await client.identify('user123', {
  plan: 'premium',
  upgraded_at: new Date().toISOString()
});
```

:::info Attribute Merging
The OpenCDP merges new attributes with existing ones. You don't need to send all attributes every time—only the ones you want to update.
:::

### Identify on User Signup

```typescript
app.post('/api/signup', async (req, res) => {
  const { email, firstName, lastName, password } = req.body;
  
  try {
    // Create user in your database
    const user = await db.users.create({
      email,
      firstName,
      lastName,
      passwordHash: await hash(password)
    });
    
    // Identify in OpenCDP with person attributes
    await client.identify(user.id, {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      created_at: user.createdAt.toISOString(),
      source: 'web_signup'
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Identify on User Login

```typescript
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await db.users.findByEmail(email);
    
    if (!user || !await verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await client.identify(user.id, {
      last_login_at: new Date().toISOString(),
      login_count: user.loginCount + 1
    });
    
    res.json({ success: true, token: generateToken(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Batch Identification

When identifying multiple users, the SDK automatically handles concurrency:

```typescript
const users = await db.users.findAll();

// The SDK will limit concurrency automatically based on maxConcurrentRequests
await Promise.all(
  users.map(user =>
    client.identify(user.id, {
      email: user.email,
      name: user.name,
      plan: user.plan
    })
  )
);

console.log(`Identified ${users.length} users`);
```

## Validation

The SDK validates inputs before sending requests:

```typescript
// ❌ Throws: Identifier cannot be empty
await client.identify('', { email: 'user@example.com' });

// ❌ Throws: Identifier cannot be empty
await client.identify('   ', { email: 'user@example.com' });

// ✅ Valid
await client.identify('user123', { email: 'user@example.com' });

// ✅ Valid - Properties are optional
await client.identify('user123');
```

## Error Handling

```typescript
try {
  await client.identify('user123', {
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe'
  });
  console.log('User identified successfully');
} catch (error) {
  if (error.message.includes('Identifier cannot be empty')) {
    console.error('Invalid identifier provided');
  } else if (error.response?.status === 401) {
    console.error('Invalid API key');
  } else if (error.response?.status === 429) {
    console.error('Rate limit exceeded');
  } else {
    console.error('Failed to identify user:', error.message);
  }
}
```

## Dual-Write Behavior

When `sendToCustomerIo` is enabled, the SDK sends the same data to both OpenCDP and Customer.io:

```typescript
const client = new CDPClient({
  cdpApiKey: 'your-cdp-key',
  sendToCustomerIo: true,
  customerIo: {
    siteId: 'your-cio-site-id',
    apiKey: 'your-cio-api-key'
  }
});

// This will send data to both OpenCDP and Customer.io
await client.identify('user123', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe'
});
```

If the Customer.io request fails, it's logged but doesn't throw an error (the OpenCDP request still succeeds).

## Best Practices

### 1. Use Consistent Identifiers

```typescript
// ✅ Good - Use consistent user IDs
await client.identify(user.id, { ... });

// ❌ Bad - Don't switch between different identifiers
await client.identify(user.email, { ... });
await client.identify(user.id, { ... });
```

### 2. Include Person Attributes Early

```typescript
// ✅ Good - Include email and name on first identify
await client.identify('user123', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe'
});
```

Person attributes like email, first name, and last name are crucial for many OpenCDP features like email campaigns, personalization, and user matching.

### 3. Use ISO Date Strings

```typescript
// ✅ Good - ISO 8601 format
await client.identify('user123', {
  created_at: new Date().toISOString(), // "2025-10-29T10:30:00.000Z"
  last_login: new Date().toISOString()
});

// ❌ Bad - Inconsistent formats
await client.identify('user123', {
  created_at: '10/29/2025',
  last_login: Date.now()
});
```

### 4. Avoid Sensitive Data

```typescript
// ❌ Never send sensitive data
await client.identify('user123', {
  email: 'user@example.com',
  password: 'secret123', // DON'T DO THIS
  ssn: '123-45-6789',   // DON'T DO THIS
  credit_card: '1234'    // DON'T DO THIS
});

// ✅ Good - Only send necessary business data
await client.identify('user123', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  plan: 'premium'
});
```

## Performance Considerations

- **Concurrency**: Limited by `maxConcurrentRequests` (default: 10)
- **Connection Pooling**: HTTP connections are reused for better performance
- **Async**: Always returns a Promise—use `await` or `.then()`

```typescript
// Sequential (slower for multiple calls)
await client.identify('user1', { email: 'user1@example.com' });
await client.identify('user2', { email: 'user2@example.com' });

// Parallel (faster, automatically limited by SDK)
await Promise.all([
  client.identify('user1', { email: 'user1@example.com' }),
  client.identify('user2', { email: 'user2@example.com' })
]);
```

## Related

- [track()](./track.md) - Track user events
- [Configuration](../getting-started/configuration.md)
- [Error Handling Guide](../guides/error-handling.md)
- [Best Practices](../guides/best-practices.md)

