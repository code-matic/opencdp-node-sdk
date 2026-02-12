---
sidebar_position: 1
slug: /
---

# OpenCDP SDKs Documentation

Welcome to the OpenCDP SDKs documentation. These libraries provide simple and powerful ways to integrate your applications with Codematic's Customer Data Platform.

## Available SDKs

### Node.js SDK

Server-side SDK for Node.js applications with TypeScript support.

**Features:**
- Identify users and track attributes
- Track custom events
- Send transactional emails (template-based or raw HTML)
- Send push notifications
- Dual-write support for migration scenarios
- Built-in concurrency limiting for high throughput
- Full TypeScript support

[View Node.js Documentation →](./node/intro.md)

### Flutter SDK

Native mobile SDK for Flutter applications (iOS & Android).

**Features:**
- User identification and tracking
- Event tracking (custom events, screen views, lifecycle)
- Push notification support with automatic delivery tracking
- Automatic screen tracking via NavigatorObserver
- Customer.io integration with dual-write support
- Device attributes tracking

[View Flutter Documentation →](./flutter/intro.md)

## What is OpenCDP?

OpenCDP is Codematic's Customer Data Platform that allows you to:

- Unify customer data from multiple sources
- Track user behavior across web and mobile
- Send personalized communications via email and push notifications
- Build customer segments for targeted campaigns
- Analyze user journeys and conversion funnels

## Core Platform Features

All SDKs provide access to:

- **User Identification** - Create and update user profiles
- **Event Tracking** - Track custom events and user behavior
- **Transactional Messaging** - Send emails and push notifications
- **Device Management** - Register devices for push notifications
- **Dual-Write Support** - Migrate seamlessly from other platforms

## Getting Started

Choose your platform to get started:

- [Node.js SDK →](./node/getting-started/installation.md)
- [Flutter SDK →](./flutter/getting-started/installation.md)

## Support & Resources

- Report bugs and request features through your support channel
- License: MIT
- Check the [Changelog](./changelog.md) for latest updates

