---
sidebar_position: 1
---

# Flutter SDK

Welcome to the **OpenCDP Flutter SDK** documentation! This SDK enables you to integrate your Flutter applications with Codematic's Customer Data Platform.

## What is the Flutter SDK?

The OpenCDP Flutter SDK (v1.2.0) is a native Flutter package that provides:

- 📱 **User identification and tracking** across iOS and Android
- 📊 **Event tracking** (custom events, screen views, lifecycle events)
- 🔔 **Push notification support** with automatic delivery tracking
- 📺 **Automatic screen tracking** via NavigatorObserver
- 🔄 **Application lifecycle tracking** (app opened, backgrounded, etc.)
- 🌐 **Customer.io integration** with dual-write support
- 📲 **Device attributes tracking** (OS, version, model, etc.)

## Platform Support

- **Android**: minSdkVersion 24, compileSdkVersion 36
- **iOS**: Minimum deployment target 15.5
- **Flutter**: Modern Flutter SDK
- **Kotlin**: 2.1.0

## Package Information

- **Package**: [open_cdp_flutter_sdk](https://pub.dev/packages/open_cdp_flutter_sdk)
- **Version**: 1.2.0
- **Publisher**: codematic.io
- **License**: MIT

## Key Features

### Automatic Screen Tracking

Enable automatic screen view tracking with a simple NavigatorObserver integration. The SDK will:
- Track all screen views in your app
- Store anonymous screen views until a user is identified
- Associate anonymous screen views with users once identified
- Include screen name, route, and timestamp in tracking data

### Push Notification Tracking

Full push notification lifecycle tracking with support for:
- Notification delivered events (foreground, background, terminated)
- Notification opened events
- iOS background delivery via Notification Service Extension
- Android FCM integration

### Customer.io Integration

Seamlessly dual-write data to both OpenCDP and Customer.io for migration scenarios.

## Getting Started

Ready to integrate the OpenCDP Flutter SDK? Head over to the [Installation Guide](./getting-started/installation.md) to get started!

## Resources

- **pub.dev**: [open_cdp_flutter_sdk](https://pub.dev/packages/open_cdp_flutter_sdk)
- **Repository**: [GitHub](https://pub.dev/packages/open_cdp_flutter_sdk)
- **API Reference**: [pub.dev documentation](https://pub.dev/documentation/open_cdp_flutter_sdk/latest/)

## Quick Links

- [Installation & Prerequisites](./getting-started/installation.md)
- [Quick Start Guide](./getting-started/quick-start.md)
- [Configuration Reference](./getting-started/configuration.md)
- [Screen Tracking Setup](./features/screen-tracking.md)
- [Push Notifications Setup](./features/push-notifications.md)

