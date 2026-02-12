---
sidebar_position: 7
---

# Changelog

All notable changes to the OpenCDP Node.js SDK.

## [5.0.9] - Current

### Features
- Full TypeScript support with type definitions
- Concurrency limiting with p-limit
- Connection pooling for optimal performance
- Dual-write support for Customer.io migration
- Comprehensive error handling with custom error types
- Support for transactional emails (template-based and raw HTML)
- Push notification support
- Device registration for push notifications
- Debug mode for detailed logging
- Custom logger support

### API Methods
- `identify()` - Identify users and update attributes
- `track()` - Track custom events
- `sendEmail()` - Send transactional emails
- `sendPush()` - Send push notifications
- `registerDevice()` - Register devices for push
- `ping()` - Test API connection

### Configuration Options
- `cdpApiKey` - OpenCDP API authentication
- `cdpEndpoint` - Custom API endpoint
- `maxConcurrentRequests` - Concurrency control (default: 10, max: 30)
- `timeout` - Request timeout (default: 10s)
- `sendToCustomerIo` - Enable dual-write
- `customerIo` - Customer.io credentials
- `debug` - Debug logging
- `cdpLogger` - Custom logger

### Dependencies
- axios ^1.8.2
- customerio-node ^4.1.1
- p-limit ^3.1.0

## Upgrade Notes

### From 4.x to 5.x

No breaking changes. Version 5.x adds new features while maintaining backward compatibility.

### From 3.x to 4.x

- Updated dependencies
- Improved error handling
- Performance optimizations

## Future Roadmap

Planned features for upcoming releases:

- Batch operation helpers
- Webhook support
- Advanced segmentation
- Analytics helpers
- Enhanced TypeScript types
- GraphQL support

## Support

For questions or issues:
- Check [Troubleshooting Guide](./troubleshooting.md)
- Review [API Documentation](./api/client.md)
- Contact Codematic support


