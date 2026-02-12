---
sidebar_position: 3
---

# Configuration Reference

Complete reference for all configuration options available in the OpenCDP Flutter SDK.

## OpenCDPConfig

The main configuration object passed to `OpenCDPSDK.initialize()`.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `cdpApiKey` | `String` | **Yes** | Your API key for OpenCDP |
| `debug` | `bool` | No | Enables verbose debug logging. Default: `false` |
| `iOSAppGroup` | `String` | **Yes** (iOS Push) | The App Group ID for iOS push tracking (e.g., `group.com.yourcompany.yourapp`) |
| `autoTrackScreens` | `bool` | No | If `true`, automatically tracks screen views via NavigatorObserver. Default: `false` |
| `trackApplicationLifecycleEvents` | `bool` | No | If `true`, tracks app lifecycle events (opened, backgrounded, etc.). Default: `false` |
| `autoTrackDeviceAttributes` | `bool` | No | If `true`, automatically tracks device attributes (OS, version, model). Default: `false` |
| `sendToCustomerIo` | `bool` | No | If `true`, enables dual-write to Customer.io. Default: `false` |
| `customerIo` | `CustomerIOConfig` | Conditional | Configuration object for Customer.io. Required if `sendToCustomerIo` is `true` |

### Example

```dart
OpenCDPConfig(
  // Required
  cdpApiKey: 'your-cdp-api-key',
  
  // iOS Push (Required for iOS push notifications)
  iOSAppGroup: 'group.com.yourcompany.yourapp',
  
  // Debug
  debug: true,
  
  // Feature Toggles
  autoTrackScreens: true,
  trackApplicationLifecycleEvents: true,
  autoTrackDeviceAttributes: true,
  
  // Customer.io
  sendToCustomerIo: true,
  customerIo: CustomerIOConfig(
    // ... see below
  ),
)
```

## CustomerIOConfig

Configuration for Customer.io integration when dual-write is enabled.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `siteId` | `String` | **Yes** | Your Customer.io Site ID |
| `apiKey` | `String` | **Yes** | Your Customer.io API Key |
| `region` | `Region` | **Yes** | Customer.io region (`Region.us` or `Region.eu`) |
| `autoTrackDeviceAttributes` | `bool` | No | If `true`, tracks device attributes in Customer.io. Default: `false` |
| `migrationSiteId` | `String` | No | Migration site ID for Customer.io |
| `inAppConfig` | `CustomerIOInAppConfig` | No | In-app messaging configuration |
| `pushConfig` | `CustomerIOPushConfig` | No | Push notification configuration |

### Example

```dart
CustomerIOConfig(
  // Required
  siteId: 'your-site-id',
  apiKey: 'your-customer-io-api-key',
  region: Region.us,
  
  // Optional
  autoTrackDeviceAttributes: true,
  migrationSiteId: 'your-migration-site-id',
  
  // Advanced configurations
  inAppConfig: CustomerIOInAppConfig(
    // ... in-app messaging config
  ),
  pushConfig: CustomerIOPushConfig(
    // ... push notification config
  ),
)
```

## Region Enum

Specifies the Customer.io data center region.

```dart
enum Region {
  us,  // United States
  eu,  // European Union
}
```

## Complete Configuration Example

Here's a complete example with all common options:

```dart
await OpenCDPSDK.initialize(
  config: OpenCDPConfig(
    // === Core Configuration ===
    cdpApiKey: 'your-cdp-api-key',
    debug: true, // Set to false in production
    
    // === iOS Push Notification Support ===
    iOSAppGroup: 'group.com.yourcompany.yourapp',
    
    // === Automatic Tracking Features ===
    autoTrackScreens: true,
    trackApplicationLifecycleEvents: true,
    autoTrackDeviceAttributes: true,
    
    // === Customer.io Integration ===
    sendToCustomerIo: true,
    customerIo: CustomerIOConfig(
      // Required
      siteId: 'your-site-id',
      apiKey: 'your-customer-io-api-key',
      region: Region.us,
      
      // Optional
      autoTrackDeviceAttributes: true,
      migrationSiteId: 'your-migration-site-id',
      
      // Push Configuration
      pushConfig: CustomerIOPushConfig(
        pushConfigAndroid: CustomerIOPushConfigAndroid(
          pushClickBehavior: PushClickBehaviorAndroid.activityPreventRestart,
        ),
      ),
      
      // In-App Messaging
      inAppConfig: CustomerIOInAppConfig(
        siteId: 'your-site-id',
      ),
    ),
  ),
);
```

## Environment-Specific Configuration

It's recommended to use different configurations for different environments:

```dart
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Determine environment
  const String environment = String.fromEnvironment(
    'ENVIRONMENT',
    defaultValue: 'development',
  );
  
  // Configure based on environment
  await OpenCDPSDK.initialize(
    config: OpenCDPConfig(
      cdpApiKey: environment == 'production'
          ? 'your-production-api-key'
          : 'your-development-api-key',
      debug: environment != 'production',
      autoTrackScreens: true,
      trackApplicationLifecycleEvents: true,
      autoTrackDeviceAttributes: true,
      iOSAppGroup: 'group.com.yourcompany.yourapp',
    ),
  );
  
  runApp(MyApp());
}
```

## Best Practices

### 1. Never Commit API Keys

Store API keys securely and never commit them to version control:

```dart
// ✅ Good - Use environment variables
const cdpApiKey = String.fromEnvironment('CDP_API_KEY');

// ❌ Bad - Hardcoded key
const cdpApiKey = 'sk_live_abc123...'; // Never do this!
```

### 2. Disable Debug Logging in Production

```dart
OpenCDPConfig(
  debug: kDebugMode, // Automatically false in release builds
  // ... other config
)
```

### 3. Use Consistent App Group IDs

The iOS App Group ID must be:
- Identical between your Dart code and Xcode configuration
- Unique to your organization
- In the format: `group.com.yourcompany.yourapp`

## Related

- [Quick Start Guide](./quick-start.md)
- [Screen Tracking Setup](../features/screen-tracking.md)
- [Push Notifications Setup](../features/push-notifications.md)

