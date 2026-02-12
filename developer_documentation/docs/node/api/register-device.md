---
sidebar_position: 6
---

# registerDevice()

Registers a mobile device for a user to enable push notifications.

## Signature

```typescript
async registerDevice(
  identifier: string,
  deviceParams: DeviceRegistrationParameters
): Promise<void>
```

## Parameters

### identifier

- **Type:** `string`
- **Required:** Yes
- **Description:** User identifier (must match the one used in `identify()`)

### deviceParams

- **Type:** `DeviceRegistrationParameters`
- **Required:** Yes
- **Description:** Device information and credentials

## DeviceRegistrationParameters Interface

```typescript
interface DeviceRegistrationParameters {
  // Required
  deviceId: string;
  platform: 'android' | 'ios' | 'web';
  fcmToken: string;
  
  // Optional
  name?: string;
  osVersion?: string;
  model?: string;
  apnToken?: string;
  appVersion?: string;
  last_active_at?: string;
  attributes?: Record<string, any>;
}
```

## Required Fields

- `deviceId` - Unique identifier for the device
- `platform` - Device platform (`'android'`, `'ios'`, or `'web'`)
- `fcmToken` - Firebase Cloud Messaging token

## Device ID Requirements

:::warning Critical: Device ID Must Be Unique and Consistent
The `deviceId` must be:
1. **Unique** to each physical device
2. **Consistent** for that device across all registrations

Each device should always use the same `deviceId`. Never generate a new ID for the same device.
:::

**Why this matters:**
- Ensures push notifications are delivered to the correct devices
- Prevents duplicate device registrations
- Allows proper tracking of device-specific analytics
- Enables device management (e.g., removing old devices)
<!-- 
**How to generate consistent device IDs:**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

async function getOrCreateDeviceId(): Promise<string> {
  // Try to get existing device ID
  let deviceId = await AsyncStorage.getItem('device_id');
  
  if (!deviceId) {
    // First time - generate and store permanently
    deviceId = uuidv4();
    await AsyncStorage.setItem('device_id', deviceId);
  }
  
  return deviceId;
}

// Use the same device ID every time
const deviceId = await getOrCreateDeviceId();
await client.registerDevice(userId, {
  deviceId,  // Same ID every time for this device
  platform: 'ios',
  fcmToken: currentToken
});
``` -->

**Common mistakes to avoid:**

```typescript
// ❌ Bad - Generates new ID every time
await client.registerDevice(userId, {
  deviceId: uuidv4(), // DON'T DO THIS
  platform: 'ios',
  fcmToken: token
});

// ❌ Bad - Using non-persistent identifiers
await client.registerDevice(userId, {
  deviceId: Date.now().toString(), // Changes every time
  platform: 'ios',
  fcmToken: token
});

// ✅ Good - Consistent, persistent device ID
const deviceId = await getOrCreateDeviceId(); // Same ID always
await client.registerDevice(userId, {
  deviceId,
  platform: 'ios',
  fcmToken: token
});
```

## Returns

`Promise<void>` - Resolves when the device is registered successfully.

## Throws

- **Error**: If identifier or required device fields are invalid
- **Network errors**: If the request fails

## Identifier Consistency

:::tip Use Consistent Identifiers
The `identifier` parameter must match the one used in `identify()`. See [Consistent Identifiers](../guides/best-practices.md#consistent-identifiers) for best practices.
:::

## Usage Examples

### Register iOS Device

```typescript
await client.registerDevice('user123', {
  deviceId: 'device_abc123',
  platform: 'ios',
  fcmToken: 'fcm_token_here',
  apnToken: 'apns_token_here',
  osVersion: '17.0',
  model: 'iPhone 14 Pro',
  appVersion: '1.2.3',
  name: 'John\'s iPhone'
});
```

### Register Android Device

```typescript
await client.registerDevice('user123', {
  deviceId: 'device_xyz789',
  platform: 'android',
  fcmToken: 'fcm_token_here',
  osVersion: '14.0',
  model: 'Samsung Galaxy S23',
  appVersion: '1.2.3',
  name: 'John\'s Samsung'
});
```

### Register Web Device

```typescript
await client.registerDevice('user123', {
  deviceId: 'web_session_abc',
  platform: 'web',
  fcmToken: 'fcm_web_token_here',
  attributes: {
    browser: 'Chrome',
    browser_version: '119.0',
    os: 'macOS'
  }
});
```

### Minimal Registration

```typescript
// Only required fields
await client.registerDevice('user123', {
  deviceId: 'device_minimal',
  platform: 'ios',
  fcmToken: 'fcm_token_here'
});
```

## Device Attributes

You can include custom attributes for segmentation and analytics:

```typescript
await client.registerDevice('user123', {
  deviceId: 'device_123',
  platform: 'ios',
  fcmToken: 'fcm_token_here',
  appVersion: '2.0.0',
  attributes: {
    app_language: 'en',
    notification_sound: 'default',
    push_enabled: true,
    install_date: '2025-01-15',
    device_timezone: 'America/New_York',
    screen_size: 'large'
  }
});
```


## Token Refresh

FCM tokens can change. Update the device registration when this happens:

```typescript
// React Native example
import messaging from '@react-native-firebase/messaging';

messaging().onTokenRefresh(async (newToken) => {
  try {
    await cdpClient.registerDevice(userId, {
      deviceId: deviceId, // Same device ID
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      fcmToken: newToken, // Updated token
      appVersion: getAppVersion(),
      last_active_at: new Date().toISOString()
    });
    
    console.log('FCM token refreshed');
  } catch (error) {
    console.error('Failed to update FCM token:', error);
  }
});
```

## Updating Device Information

Re-register a device to update its information:

```typescript
// Update app version after app update
await client.registerDevice('user123', {
  deviceId: 'device_abc123', // Same device ID
  platform: 'ios',
  fcmToken: currentFcmToken,
  appVersion: '2.0.0', // New version
  last_active_at: new Date().toISOString()
});
```

## Multiple Devices Per User

Users can have multiple registered devices:

```typescript
// Register iPhone
await client.registerDevice('user123', {
  deviceId: 'iphone_abc',
  platform: 'ios',
  fcmToken: 'token_iphone',
  name: 'John\'s iPhone'
});

// Register iPad
await client.registerDevice('user123', {
  deviceId: 'ipad_xyz',
  platform: 'ios',
  fcmToken: 'token_ipad',
  name: 'John\'s iPad'
});

// Register Android phone
await client.registerDevice('user123', {
  deviceId: 'android_def',
  platform: 'android',
  fcmToken: 'token_android',
  name: 'John\'s Android'
});

// Send push - will go to all registered devices
await client.sendPush({
  identifiers: { id: 'user123' },
  transactional_message_id: 'WELCOME',
  title: 'Welcome!',
  body: 'Thanks for joining'
});
```

## Error Handling

```typescript
try {
  await client.registerDevice('user123', {
    deviceId: 'device_abc',
    platform: 'ios',
    fcmToken: 'fcm_token_here'
  });
  
  console.log('Device registered successfully');
} catch (error) {
  if (error.message.includes('Identifier cannot be empty')) {
    console.error('Invalid user identifier');
  } else if (error.response?.status === 401) {
    console.error('Invalid API key');
  } else {
    console.error('Failed to register device:', error.message);
  }
}
```

## Dual-Write Behavior

When dual-write is enabled, device registration is sent to both OpenCDP and Customer.io:

```typescript
const client = new CDPClient({
  cdpApiKey: 'your-cdp-key',
  sendToCustomerIo: true,
  customerIo: {
    siteId: 'your-cio-site-id',
    apiKey: 'your-cio-api-key'
  }
});

// Registers device in both platforms
await client.registerDevice('user123', {
  deviceId: 'device_abc',
  platform: 'ios',
  fcmToken: 'fcm_token_here'
});
```

If the Customer.io request fails, it's logged but doesn't throw (OpenCDP registration still succeeds).

## Best Practices

### 1. Register Early

```typescript
// ✅ Good - Register as soon as user is authenticated
async function handleLogin(userId: string) {
  await authenticateUser(userId);
  
  // Register device immediately
  await registerDevice(userId);
}
```

### 2. Update on App Launch

```typescript
// ✅ Good - Update device info on each launch
async function onAppLaunch() {
  const userId = await getCurrentUserId();
  if (userId) {
    await client.registerDevice(userId, {
      deviceId: getDeviceId(),
      platform: getPlatform(),
      fcmToken: await getFCMToken(),
      appVersion: getAppVersion(),
      last_active_at: new Date().toISOString()
    });
  }
}
```

### 3. Handle Token Refresh

```typescript
// ✅ Good - Listen for token changes
messaging().onTokenRefresh(async (newToken) => {
  await updateDeviceToken(newToken);
});
```

### Debug Mode

```typescript
const client = new CDPClient({
  cdpApiKey: process.env.CDP_API_KEY,
  debug: true // See detailed logs
});

await client.registerDevice('user123', {
  deviceId: 'device_abc',
  platform: 'ios',
  fcmToken: 'token'
});
```

## Related

- [sendPush()](./send-push.md) - Send push notifications
- [identify()](./identify.md) - Identify users
- [Push Examples](../examples/push-notifications.md)
- [Error Handling Guide](../guides/error-handling.md)

