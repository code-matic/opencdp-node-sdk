---
sidebar_position: 1
---

# Node.js SDK

Welcome to the **OpenCDP Node.js SDK** documentation! This library provides a simple and powerful way to integrate your Node.js application with Codematic's Customer Data Platform.

## What is the Node.js SDK?

The OpenCDP Node.js SDK is a TypeScript-first library that allows you to:

- 🎯 **Identify users** and track their attributes
- 📊 **Track events** to understand user behavior
- 📧 **Send transactional emails** (template-based or raw HTML)
- 📱 **Send push notifications** to your users
- 🔄 **Dual-write** for migration scenarios
- ⚡ **Handle high throughput** with built-in concurrency limiting
- 🛡️ **Type-safe** with full TypeScript support

## Key Features

### Simple API

The SDK provides an intuitive API that makes it easy to get started:

```typescript
import { CDPClient } from '@codematic.io/cdp-node';

const client = new CDPClient({
  cdpApiKey: 'your-api-key'
});

await client.identify('user123', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe'
});

await client.track('user123', 'purchase_completed', {
  amount: 99.99
});
```

### Production-Ready

- **Connection pooling** for optimal performance
- **Automatic concurrency limiting** to prevent overwhelming your infrastructure
- **Comprehensive error handling** with detailed error messages
- **Dual-write support** for seamless migration from Customer.io

### TypeScript Support

Built with TypeScript from the ground up, providing excellent IDE support and type safety:

```typescript
// Full type checking and autocomplete
const emailRequest: SendEmailRequestWithTemplate = {
  to: 'user@example.com',
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME_EMAIL',
  message_data: { name: 'John' }
};
```

## Getting Started

Ready to integrate the OpenCDP Node.js SDK? Head over to the [Installation Guide](./getting-started/installation.md) to get started!

## Resources

- **npm Package**: [@codematic.io/cdp-node](https://www.npmjs.com/package/@codematic.io/cdp-node)
- **License**: MIT

## Quick Links

- [Installation](./getting-started/installation.md)
- [Quick Start Guide](./getting-started/quick-start.md)
- [API Reference](./api/client.md)
- [Examples](./examples/basic-usage.md)
- [Best Practices](./guides/best-practices.md)

