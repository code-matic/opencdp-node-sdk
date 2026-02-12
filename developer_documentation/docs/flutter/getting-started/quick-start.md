---
sidebar_position: 2
---

# Quick Start

This guide will help you initialize and start using the OpenCDP Flutter SDK in your application.

## Initialize the SDK (Critical)

:::warning Critical
The SDK **MUST** be initialized before using any of its methods. If you don't initialize the SDK, all tracking operations will fail silently and you'll see error messages in the console. Make sure to await the `initialize()` call.
:::

You must initialize the SDK before your `runApp()` call, typically in `lib/main.dart`.

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:open_cdp_flutter_sdk/open_cdp_flutter_sdk.dart';
import 'package:firebase_core/firebase_core.dart';

// Import your push service file (see Push Notifications guide)
import 'push_service.dart';

Future<void> main() async {
  // Ensure Flutter bindings are initialized
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase (Required for Push Notifications)
  await Firebase.initializeApp();

  // Initialize the OpenCDP SDK
  try {
    await OpenCDPSDK.initialize(
      config: OpenCDPConfig(
        // === Core Config ===
        cdpApiKey: 'your-cdp-api-key',
        debug: true, // Set to false for production

        // === Feature Toggles ===
        autoTrackScreens: true,
        trackApplicationLifecycleEvents: true,
        autoTrackDeviceAttributes: true,
        
        // === Customer.io Dual Write ===
        sendToCustomerIo: true,
        customerIo: CustomerIOConfig(
          apiKey: 'your-customer-io-api-key',
          siteId: 'your-site-id',
          region: Region.us, // or Region.eu
          autoTrackDeviceAttributes: true,
          // ... other Customer.io configs as needed
        ),

        // === Push Notification Config ===
        // This is the App Group ID you will create in Xcode
        iOSAppGroup: 'group.com.yourcompany.yourapp', 
      ),
    );

    // Set up push listeners *after* SDK initialization
    await PushService.setupPushListeners();

  } catch (e) {
    print('Failed to initialize OpenCDP SDK: $e');
  }

  runApp(MyApp());
}
```

## Core API Usage

Once initialized, you can access the SDK instance anywhere in your app.

### Identify Users

```dart
await OpenCDPSDK.instance.identify(
  identifier: 'user123',
  properties: {
    'name': 'John Doe',
    'email': 'john@example.com',
    'plan': 'premium'
  },
);
```

### Track Events

```dart
await OpenCDPSDK.instance.track(
  eventName: 'purchase',
  properties: {
    'product_id': '123',
    'price': 99.99,
    'currency': 'USD'
  },
);
```

### Track Screen Views

```dart
await OpenCDPSDK.instance.trackScreenView(
  title: 'Product Details',
  properties: {
    'product_id': '123',
    'category': 'Electronics'
  },
);
```

### Register Device for Push Notifications

```dart
await OpenCDPSDK.instance.registerDeviceToken(
  fcmToken: 'firebase-token', // Android
  apnToken: 'apns-token',     // iOS
);
```

## Important Migration Note

:::info Version 1.0.5 Update
The `OpenCDPSDK.update()` method has been removed. To update user properties, call `identify()` again with the same identifier and the new properties.
:::

**Before (v1.0.4 and earlier):**
```dart
await OpenCDPSDK.instance.update(
  properties: {'last_purchase': DateTime.now().toIso8601String()},
);
```

**After (v1.0.5+):**
```dart
await OpenCDPSDK.instance.identify(
  identifier: 'user123', // Same identifier
  properties: {'last_purchase': DateTime.now().toIso8601String()},
);
```

## Next Steps

- [Set up Automatic Screen Tracking](../features/screen-tracking.md)
- [Configure Push Notifications](../features/push-notifications.md)
- [View Configuration Options](./configuration.md)

## Related

- [Installation](./installation.md)
- [Configuration Reference](./configuration.md)
- [Screen Tracking](../features/screen-tracking.md)
- [Push Notifications](../features/push-notifications.md)

