---
sidebar_position: 1
---

# Installation

This guide covers the prerequisites and installation steps for the OpenCDP Flutter SDK (v1.2.0).

## Prerequisites & Minimum Requirements

Before integrating, ensure your development environment meets the following minimum requirements:

### Flutter

- A modern Flutter SDK

### Android

- **minSdkVersion**: 24
- **compileSdkVersion**: 36
- **Android Gradle Plugin (AGP)**: 8.9.1
- **Kotlin**: 2.1.0

### iOS

- **Minimum Deployment Target**: 15.5

### Required Accounts

- **OpenCDP API Key** (`cdpApiKey`)
- **(Optional)** Customer.io Site ID and API Key (if using dual-write)

### Required Dependencies

If you plan to use **Push Notifications**, you must also install and configure:
- `firebase_core`
- `firebase_messaging`

## Installation Steps

### Step 1: Add Dependency

Add the package to your `pubspec.yaml` file. We recommend using the latest version.

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Add the OpenCDP SDK
  open_cdp_flutter_sdk: ^1.2.0

  # Required for Push Notifications
  firebase_core: ^latest
  firebase_messaging: ^latest
```

### Step 2: Install Packages

Run the following command in your terminal to install the dependencies:

```bash
flutter pub get
```

## Verification

After installation, verify that the package is installed correctly:

```bash
flutter pub deps | grep open_cdp_flutter_sdk
```

You should see output similar to:

```
|-- open_cdp_flutter_sdk 1.2.0
```

## Next Steps

Now that you have the SDK installed, continue to the [Quick Start Guide](./quick-start.md) to initialize and configure the SDK.

## Related

- [Quick Start Guide](./quick-start.md)
- [Configuration Reference](./configuration.md)
- [pub.dev package page](https://pub.dev/packages/open_cdp_flutter_sdk)

