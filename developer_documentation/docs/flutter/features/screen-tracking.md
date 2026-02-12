---
sidebar_position: 1
---

# Automatic Screen Tracking

The OpenCDP Flutter SDK provides automatic screen tracking through a `NavigatorObserver` that monitors route changes in your app.

## Overview

When enabled, the screen tracker will automatically:

- ✅ Track all screen views in your app
- ✅ Store anonymous screen views until a user is identified
- ✅ Associate anonymous screen views with users once they are identified
- ✅ Include screen name, route, and timestamp in the tracking data

## Setup

### Step 1: Enable in Configuration

Set `autoTrackScreens: true` in your SDK configuration:

```dart
await OpenCDPSDK.initialize(
  config: OpenCDPConfig(
    cdpApiKey: 'your-api-key',
    autoTrackScreens: true, // Enable automatic screen tracking
    // ... other config options
  ),
);
```

### Step 2: Add Navigator Observer

Add the screen tracker to your app's navigator observers in your `MaterialApp`:

```dart
MaterialApp(
  navigatorObservers: [
    OpenCDPSDK.instance.screenTracker!,
  ],
  // ... other app configuration
  home: MyHomePage(),
);
```

:::warning Required Setup
Both steps are required for automatic screen tracking to work. The configuration enables the feature, and the navigator observer performs the actual tracking.
:::

## Complete Example

Here's a complete example showing screen tracking setup:

```dart
import 'package:flutter/material.dart';
import 'package:open_cdp_flutter_sdk/open_cdp_flutter_sdk.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize SDK with screen tracking enabled
  await OpenCDPSDK.initialize(
    config: OpenCDPConfig(
      cdpApiKey: 'your-api-key',
      autoTrackScreens: true,
      debug: true,
    ),
  );
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'My App',
      // Add the screen tracker observer
      navigatorObservers: [
        OpenCDPSDK.instance.screenTracker!,
      ],
      home: HomePage(),
      routes: {
        '/profile': (context) => ProfilePage(),
        '/settings': (context) => SettingsPage(),
      },
    );
  }
}
```

## How It Works

### Anonymous Screen Views

Before a user is identified, screen views are stored locally:

```dart
// User navigates to a screen (not yet identified)
Navigator.pushNamed(context, '/products');

// Screen view is stored locally as anonymous
```

### Identified Screen Views

Once a user is identified, all screen views (past and future) are associated with that user:

```dart
// Identify the user
await OpenCDPSDK.instance.identify(
  identifier: 'user123',
  properties: {'email': 'user@example.com'},
);

// All previous anonymous screen views are now associated with user123
// Future screen views are automatically tracked with user123
```

## Manual Screen Tracking

You can also manually track screen views if needed:

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

## Tracked Data

Each screen view event includes:

- **Screen Name**: The route name or title
- **Route**: The full route path
- **Timestamp**: When the screen was viewed
- **Custom Properties**: Any additional properties you provide

## Best Practices

### 1. Use Named Routes

Named routes provide better screen names in your tracking data:

```dart
// ✅ Good - Named route
Navigator.pushNamed(context, '/product-details');

// ❌ Less descriptive
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => ProductDetailsPage()),
);
```

### 2. Add Custom Properties

Enhance screen view tracking with custom properties:

```dart
await OpenCDPSDK.instance.trackScreenView(
  title: 'Product Details',
  properties: {
    'product_id': product.id,
    'category': product.category,
    'price': product.price,
    'source': 'search', // How the user got here
  },
);
```

### 3. Identify Users Early

Identify users as soon as possible to minimize anonymous screen views:

```dart
// Identify immediately after login
await handleLogin(email, password);
await OpenCDPSDK.instance.identify(
  identifier: userId,
  properties: {'email': email},
);
```

## Disabling Automatic Tracking

If you want to manually control screen tracking, simply:

1. Set `autoTrackScreens: false` in your configuration
2. Don't add the navigator observer
3. Use `trackScreenView()` manually when needed

```dart
OpenCDPConfig(
  cdpApiKey: 'your-api-key',
  autoTrackScreens: false, // Disable automatic tracking
  // ... other config
)
```

## Troubleshooting

### Screen Views Not Tracking

If screen views aren't being tracked:

1. ✅ Verify `autoTrackScreens: true` in configuration
2. ✅ Verify you added the navigator observer to MaterialApp
3. ✅ Check debug logs for errors
4. ✅ Ensure the SDK is initialized before runApp()

### Navigator Observer Not Found

If you get a null error accessing `screenTracker`:

```dart
// ❌ Wrong - screenTracker is null when autoTrackScreens is false
navigatorObservers: [
  OpenCDPSDK.instance.screenTracker!, // Will throw if autoTrackScreens is false
]

// ✅ Correct - Check if it exists first
navigatorObservers: [
  if (OpenCDPSDK.instance.screenTracker != null)
    OpenCDPSDK.instance.screenTracker!,
]
```

## Related

- [Quick Start Guide](../getting-started/quick-start.md)
- [Configuration Reference](../getting-started/configuration.md)
- [Push Notifications](./push-notifications.md)

