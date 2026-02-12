---
sidebar_position: 1
---

# API Reference

Complete reference for all OpenCDP Flutter SDK methods.

## OpenCDPSDK.initialize()

Initializes the OpenCDP SDK. **Must be called before any other SDK methods.**

### Signature

```dart
static Future<void> initialize({
  required OpenCDPConfig config,
})
```

### Parameters

- `config` ([OpenCDPConfig](../getting-started/configuration.md#opencdpconfig)) - Configuration object

### Returns

`Future<void>` - Completes when initialization is successful

### Example

```dart
await OpenCDPSDK.initialize(
  config: OpenCDPConfig(
    cdpApiKey: 'your-api-key',
    debug: true,
    autoTrackScreens: true,
  ),
);
```

:::danger Critical
This method **MUST** be called before using any other SDK methods. All operations will fail silently if the SDK is not initialized.
:::

---

## OpenCDPSDK.instance

Accesses the singleton SDK instance after initialization.

### Signature

```dart
static OpenCDPSDK get instance
```

### Example

```dart
final sdk = OpenCDPSDK.instance;
await sdk.identify(identifier: 'user123');
```

---

## identify()

Identifies a user and sets their attributes.

### Signature

```dart
Future<void> identify({
  required String identifier,
  Map<String, dynamic>? properties,
})
```

### Parameters

- `identifier` (String, required) - Unique identifier for the user
- `properties` (`Map<String, dynamic>?`, optional) - User attributes

### Returns

`Future<void>` - Completes when the user is identified successfully

### Example

```dart
await OpenCDPSDK.instance.identify(
  identifier: 'user123',
  properties: {
    'email': 'user@example.com',
    'firstName': 'John',
    'lastName': 'Doe',
    'plan': 'premium',
    'created_at': DateTime.now().toIso8601String(),
  },
);
```

### Notes

- The identifier should be consistent across sessions
- Use this method to update user properties (no separate `update()` method)
- Properties are merged with existing user data

---

## track()

Tracks a custom event.

### Signature

```dart
Future<void> track({
  required String eventName,
  Map<String, dynamic>? properties,
})
```

### Parameters

- `eventName` (String, required) - Name of the event to track
- `properties` (`Map<String, dynamic>?`, optional) - Event properties

### Returns

`Future<void>` - Completes when the event is tracked successfully

### Example

```dart
await OpenCDPSDK.instance.track(
  eventName: 'purchase_completed',
  properties: {
    'product_id': 'prod_123',
    'product_name': 'Premium Subscription',
    'price': 99.99,
    'currency': 'USD',
    'quantity': 1,
  },
);
```

### Notes

- Use descriptive event names (e.g., `purchase_completed`, `video_watched`)
- Event names are case-sensitive
- Properties can include any JSON-serializable values

---

## trackScreenView()

Tracks a screen view event.

### Signature

```dart
Future<void> trackScreenView({
  required String title,
  Map<String, dynamic>? properties,
})
```

### Parameters

- `title` (String, required) - Screen or page title
- `properties` (`Map<String, dynamic>?`, optional) - Additional screen properties

### Returns

`Future<void>` - Completes when the screen view is tracked successfully

### Example

```dart
await OpenCDPSDK.instance.trackScreenView(
  title: 'Product Details',
  properties: {
    'product_id': '123',
    'category': 'Electronics',
    'source': 'search',
  },
);
```

### Notes

- This is called automatically if `autoTrackScreens` is enabled
- Use this method for manual screen tracking
- Screen views are stored anonymously until a user is identified

---

## registerDeviceToken()

Registers a device token for push notifications.

### Signature

```dart
Future<void> registerDeviceToken({
  String? fcmToken,
  String? apnToken,
})
```

### Parameters

- `fcmToken` (String?, optional) - Firebase Cloud Messaging token (Android)
- `apnToken` (String?, optional) - Apple Push Notification token (iOS)

### Returns

`Future<void>` - Completes when the device token is registered successfully

### Example

```dart
// Get FCM token
final fcmToken = await FirebaseMessaging.instance.getToken();

// Register device
await OpenCDPSDK.instance.registerDeviceToken(
  fcmToken: fcmToken, // Android
  apnToken: fcmToken, // iOS (FCM handles APNS)
);
```

### Notes

- Call this after user identification
- Re-register when the token refreshes
- Required for push notification tracking

---

## handleForegroundPushDelivery()

Handles push notification delivery when app is in foreground.

### Signature

```dart
static void handleForegroundPushDelivery(
  Map<String, dynamic> messageData,
)
```

### Parameters

- `messageData` (`Map<String, dynamic>`) - Notification payload from Firebase

### Example

```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  OpenCDPSDK.handleForegroundPushDelivery(message.data);
});
```

### Notes

- Automatically tracks "delivered" event
- Call from foreground message listener
- No return value

---

## handleBackgroundPushDelivery()

Handles push notification delivery when app is in background or terminated.

### Signature

```dart
static void handleBackgroundPushDelivery(
  Map<String, dynamic> messageData,
)
```

### Parameters

- `messageData` (`Map<String, dynamic>`) - Notification payload from Firebase

### Example

```dart
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  OpenCDPSDK.handleBackgroundPushDelivery(message.data);
}
```

### Notes

- Must be called from a top-level background handler function
- Firebase must be initialized in the background handler
- Automatically tracks "delivered" event

---

## handlePushNotificationOpen()

Handles when a user taps on a push notification.

### Signature

```dart
static void handlePushNotificationOpen(
  Map<String, dynamic> messageData,
)
```

### Parameters

- `messageData` (`Map<String, dynamic>`) - Notification payload from Firebase

### Example

```dart
// Handle notification opened from terminated state
FirebaseMessaging.instance.getInitialMessage().then((message) {
  if (message != null) {
    OpenCDPSDK.handlePushNotificationOpen(message.data);
  }
});

// Handle notification opened from background state
FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  OpenCDPSDK.handlePushNotificationOpen(message.data);
});
```

### Notes

- Automatically tracks "opened" event
- Call from both initial message and onMessageOpenedApp listeners
- No return value

---

## screenTracker

Provides access to the NavigatorObserver for automatic screen tracking.

### Signature

```dart
NavigatorObserver? get screenTracker
```

### Returns

`NavigatorObserver?` - The screen tracking observer, or `null` if `autoTrackScreens` is disabled

### Example

```dart
MaterialApp(
  navigatorObservers: [
    if (OpenCDPSDK.instance.screenTracker != null)
      OpenCDPSDK.instance.screenTracker!,
  ],
  // ... other configuration
);
```

### Notes

- Only available when `autoTrackScreens: true` in configuration
- Add to MaterialApp's `navigatorObservers` list
- Returns `null` if automatic tracking is disabled

---

## Complete Usage Example

```dart
import 'package:flutter/material.dart';
import 'package:open_cdp_flutter_sdk/open_cdp_flutter_sdk.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

// Background message handler
@pragma('vm:entry-point')
Future<void> backgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  OpenCDPSDK.handleBackgroundPushDelivery(message.data);
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // 1. Initialize SDK
  await OpenCDPSDK.initialize(
    config: OpenCDPConfig(
      cdpApiKey: 'your-api-key',
      debug: true,
      autoTrackScreens: true,
      trackApplicationLifecycleEvents: true,
      iOSAppGroup: 'group.com.yourcompany.yourapp',
    ),
  );

  // 2. Setup push handlers
  FirebaseMessaging.onBackgroundMessage(backgroundHandler);
  
  FirebaseMessaging.onMessage.listen((message) {
    OpenCDPSDK.handleForegroundPushDelivery(message.data);
  });
  
  FirebaseMessaging.instance.getInitialMessage().then((message) {
    if (message != null) {
      OpenCDPSDK.handlePushNotificationOpen(message.data);
    }
  });
  
  FirebaseMessaging.onMessageOpenedApp.listen((message) {
    OpenCDPSDK.handlePushNotificationOpen(message.data);
  });

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // 3. Add screen tracker
      navigatorObservers: [
        if (OpenCDPSDK.instance.screenTracker != null)
          OpenCDPSDK.instance.screenTracker!,
      ],
      home: HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  Future<void> handleLogin(String userId) async {
    // 4. Identify user
    await OpenCDPSDK.instance.identify(
      identifier: userId,
      properties: {
        'email': 'user@example.com',
        'firstName': 'John',
        'lastName': 'Doe',
      },
    );

    // 5. Register device for push
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) {
      await OpenCDPSDK.instance.registerDeviceToken(
        fcmToken: token,
        apnToken: token,
      );
    }

    // 6. Track event
    await OpenCDPSDK.instance.track(
      eventName: 'user_logged_in',
      properties: {'method': 'email'},
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Home')),
      body: Center(child: Text('Welcome')),
    );
  }
}
```

## Related

- [Configuration Reference](../getting-started/configuration.md)
- [Quick Start Guide](../getting-started/quick-start.md)
- [pub.dev API Documentation](https://pub.dev/documentation/open_cdp_flutter_sdk/latest/)

