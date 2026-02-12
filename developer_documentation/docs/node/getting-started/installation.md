---
sidebar_position: 1
---

# Installation

Install the OpenCDP Node SDK using your preferred package manager.

## npm

```bash
npm install @codematic.io/cdp-node
```

## yarn

```bash
yarn add @codematic.io/cdp-node
```

## pnpm

```bash
pnpm add @codematic.io/cdp-node
```

## Package Variants

This SDK is available in two npm packages:

- **`@codematic.io/cdp-node`** (recommended) - Scoped package for production use
- **`cdp-node`** - Unscoped package for legacy compatibility

Both packages contain identical functionality. **Use the scoped version for new projects.**

## Requirements

- **Node.js**: 14.x or higher
- **TypeScript**: 4.x or higher (optional, but recommended)

## Verify Installation

After installation, verify that the package is installed correctly:

```bash
npm list @codematic.io/cdp-node
```

You should see output similar to:

```
your-project@1.0.0 /path/to/your-project
└── @codematic.io/cdp-node@5.0.9
```

## TypeScript Configuration

If you're using TypeScript, make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "lib": ["es2020"],
    "target": "es2020"
  }
}
```

## Next Steps

Now that you have the SDK installed, continue to the [Quick Start Guide](./quick-start.md) to start integrating with the OpenCDP.

