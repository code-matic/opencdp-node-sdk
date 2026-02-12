---
sidebar_position: 2
---

# Push Notification Tracking

Complete guide to setting up push notification tracking in your Flutter app with the OpenCDP SDK.

## Overview

The OpenCDP Flutter SDK provides comprehensive push notification tracking for:

- ✅ **Notification delivered** events (foreground, background, terminated states)
- ✅ **Notification opened** events
- ✅ **iOS background delivery** via Notification Service Extension
- ✅ **Android FCM integration** with automatic tracking

## Prerequisites

Before setting up push notifications, ensure you have:

- Completed [Installation](../getting-started/installation.md) and [Quick Start](../getting-started/quick-start.md)
- Added `firebase_core` and `firebase_messaging` to your `pubspec.yaml`
- Configured Firebase for your iOS and Android apps
- Created an iOS App Group (for iOS background tracking)

## Setup Overview

Push notification setup requires configuration in three areas:

1. **Dart code** - Push handlers and listeners
2. **Android** - No additional native configuration needed
3. **iOS Native** - Notification Service Extension setup

---

## 1. Dart Setup

### Step 1: Create Push Service File

Create a new file `lib/push_service.dart` to hold your push handler logic:

```dart
// lib/push_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:open_cdp_flutter_sdk/open_cdp_flutter_sdk.dart';
import 'package:firebase_core/firebase_core.dart';

// This handler MUST be a top-level function
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Initialize Firebase for the background isolate
  await Firebase.initializeApp();

  // Let the SDK handle the background delivery event
  OpenCDPSDK.handleBackgroundPushDelivery(message.data);
}

class PushService {
  static Future<void> setupPushListeners() async {
    // 1. Set the background message handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // 2. Handles "delivered" events when the app is in the foreground
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      OpenCDPSDK.handleForegroundPushDelivery(message.data);
    });

    // 3. Handles "opened" events if the app is opened from a terminated state
    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message != null) {
        OpenCDPSDK.handlePushNotificationOpen(message.data);
      }
    });

    // 4. Handles "opened" events if the app is opened from a background state
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      OpenCDPSDK.handlePushNotificationOpen(message.data);
    });
  }
}
```

:::warning Top-Level Function Required
The `firebaseMessagingBackgroundHandler` **must** be a top-level function (not inside a class). This is required by Flutter's background isolate system.
:::

### Step 2: Call in main.dart

In your `lib/main.dart`, import and call the push service setup **after** SDK initialization:

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:open_cdp_flutter_sdk/open_cdp_flutter_sdk.dart';

// Import your push service
import 'push_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();

  // Initialize OpenCDP SDK
  await OpenCDPSDK.initialize(
    config: OpenCDPConfig(
      cdpApiKey: 'your-api-key',
      iOSAppGroup: 'group.com.yourcompany.yourapp',
      // ... other config
    ),
  );

  // Set up push listeners AFTER SDK initialization
  await PushService.setupPushListeners();

  runApp(MyApp());
}
```

---

## 2. Android Setup

:::tip No Additional Configuration
No additional native configuration is required for Android. The Dart code is sufficient for full push notification tracking.
:::

Firebase Cloud Messaging (FCM) is automatically configured through the `google-services.json` file in your Android project.

---

## 3. iOS Native Setup

iOS requires additional native configuration to track notification delivery when your app is in the background or terminated.

### Step 1: Open Xcode

Open your project's iOS workspace:

```bash
cd ios
open Runner.xcworkspace
```

### Step 2: Add Notification Service Extension

1. In Xcode, go to **File > New > Target...**
2. Select **Notification Service Extension** and click **Next**
3. Enter a name (e.g., `NotificationService`) and click **Finish**
4. When prompted to activate the new scheme, click **Do not Activate**

### Step 3: Add App Group

The App Group allows the extension and main app to share data.

#### For Main App (Runner target):

1. Select the **Runner** target in Xcode
2. Go to the **Signing & Capabilities** tab
3. Click **+ Capability** and add **App Groups**
4. Click the **+** button in the App Groups section
5. Add a new group with ID: `group.com.yourcompany.yourapp`
   (This must match the `iOSAppGroup` in your Dart config)

#### For Notification Service Extension:

1. Select your **NotificationService** extension target
2. Repeat the exact same steps above
3. **Important**: Select the **exact same** App Group ID

:::warning Matching App Group IDs
The App Group ID must be:
- Identical in both targets (Runner and NotificationService)
- Identical to the `iOSAppGroup` in your Dart configuration
- Unique to your organization
- In the format: `group.com.yourcompany.yourapp`
:::

### Step 4: Add Code to Extension

In the Xcode project navigator, find the **NotificationService** folder and open `NotificationService.swift`.

Replace its entire contents with this code:

```swift
// In NotificationService/NotificationService.swift
import UserNotifications
import open_cdp_flutter_sdk // Import the SDK's native package

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        self.bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

        // !!! IMPORTANT: Paste your App Group ID here !!!
        let appGroup = "group.com.yourcompany.yourapp"

        // Pass the request to the OpenCDP SDK Handler
        OpenCdpPushExtensionHelper.didReceiveNotificationExtensionRequest(
            request,
            appGroup: appGroup
        ) { modifiedContent in
            contentHandler(modifiedContent)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        // Called if the SDK's processing takes too long.
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
}
```

:::warning Update App Group ID
Make sure to replace `"group.com.yourcompany.yourapp"` with your actual App Group ID!
:::

### Step 5: Configure Podfile

Open the `ios/Podfile` in your code editor and add the new extension target.

Your Podfile should look similar to this:

```ruby
# In ios/Podfile

# ... (existing content like platform and project setup) ...

target 'Runner' do
  use_modular_headers!
  flutter_install_all_ios_pods File.dirname(File.realpath(__FILE__))

  # Link the plugin to the main Runner target
  pod 'open_cdp_flutter_sdk', :path => '.symlinks/plugins/open_cdp_flutter_sdk/ios'
end

# === ADD THIS NEW TARGET ===
target 'NotificationService' do
  inherit! :search_paths
  use_modular_headers!

  # Link the SDK's native code to the extension
  pod 'open_cdp_flutter_sdk', :path => '.symlinks/plugins/open_cdp_flutter_sdk/ios'
end

post_install do |installer|
  # ... (existing content) ...
end
```

### Step 6: Install Pods

Run `pod install` from your `ios` directory:

```bash
cd ios
pod install
cd ..
```

---

## How It Works

### Event Types

The SDK automatically tracks three types of push notification events:

1. **Delivered** - Notification was delivered to the device
   - Foreground: App is open and active
   - Background: App is backgrounded
   - Terminated: App is not running

2. **Opened** - User tapped the notification
   - From background state
   - From terminated state

### Event Handlers

| Handler Method | When Called | Platform |
|----------------|-------------|----------|
| `handleForegroundPushDelivery()` | Notification received while app is in foreground | iOS, Android |
| `handleBackgroundPushDelivery()` | Notification received while app is in background or terminated | iOS, Android |
| `handlePushNotificationOpen()` | User taps notification | iOS, Android |

## Testing

### Test Foreground Delivery

1. Ensure your app is open and in the foreground
2. Send a test notification from Firebase Console
3. Check debug logs for tracking confirmation

### Test Background Delivery

1. Background your app (don't close it)
2. Send a test notification
3. Check that the background handler was called

### Test Notification Open

1. Send a notification (app backgrounded or closed)
2. Tap the notification
3. Verify the open event was tracked

## Troubleshooting

### iOS: Notifications Not Tracking in Background

1. ✅ Verify App Group ID matches in all three places:
   - Dart configuration (`iOSAppGroup`)
   - Runner target capabilities
   - NotificationService target capabilities
2. ✅ Verify `NotificationService.swift` has correct App Group ID
3. ✅ Verify Podfile links SDK to extension target
4. ✅ Run `pod install` after Podfile changes

### Android: Background Handler Not Called

1. ✅ Verify `@pragma('vm:entry-point')` annotation on handler function
2. ✅ Verify handler is a top-level function (not in a class)
3. ✅ Verify Firebase is initialized in the background handler

### Events Not Appearing in Dashboard

1. ✅ Verify user is identified before sending notifications
2. ✅ Check debug logs for error messages
3. ✅ Verify API key is correct
4. ✅ Ensure notification payload includes required data

## Best Practices

### 1. Register Device Token

Always register the device token after user identification:

```dart
// After user logs in
await OpenCDPSDK.instance.identify(
  identifier: userId,
  properties: {'email': email},
);

// Register device for push
final fcmToken = await FirebaseMessaging.instance.getToken();
await OpenCDPSDK.instance.registerDeviceToken(
  fcmToken: fcmToken, // Android
  apnToken: fcmToken, // iOS (FCM handles conversion)
);
```

### 2. Handle Token Refresh

Listen for token updates:

```dart
FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
  OpenCDPSDK.instance.registerDeviceToken(
    fcmToken: newToken,
    apnToken: newToken,
  );
});
```

### 3. Test on Real Devices

Always test push notifications on real devices, not simulators/emulators:
- iOS Simulator cannot receive push notifications
- Android Emulator requires special setup

## Related

- [Quick Start Guide](../getting-started/quick-start.md)
- [Configuration Reference](../getting-started/configuration.md)
- [Screen Tracking](./screen-tracking.md)
- [Firebase Messaging Documentation](https://firebase.google.com/docs/cloud-messaging/flutter/client)

