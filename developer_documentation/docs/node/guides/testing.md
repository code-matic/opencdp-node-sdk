---
sidebar_position: 4
---

# Testing Guide

Learn how to test code that uses the OpenCDP Node SDK.

## Overview

Testing OpenCDP integrations ensures your application handles user data correctly without making actual API calls during tests.

## Mocking Strategies

### Jest Mocking

Mock the entire OpenCDP client:

```typescript
import { CDPClient } from '@codematic.io/cdp-node';

jest.mock('@codematic.io/cdp-node');

describe('UserService', () => {
  let mockClient: jest.Mocked<CDPClient>;
  
  beforeEach(() => {
    mockClient = {
      identify: jest.fn().mockResolvedValue(undefined),
      track: jest.fn().mockResolvedValue(undefined),
      sendEmail: jest.fn().mockResolvedValue({ success: true }),
      sendPush: jest.fn().mockResolvedValue({ success: true }),
      registerDevice: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue(undefined)
    } as any;
    
    (CDPClient as jest.Mock).mockImplementation(() => mockClient);
  });
  
  test('identifies user on signup', async () => {
    const service = new UserService();
    await service.signupUser('user@example.com', 'John Doe');
    
    expect(mockClient.identify).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        email: 'user@example.com',
        name: 'John Doe'
      })
    );
  });
});
```

### Manual Mocking

Create a mock client class:

```typescript
// __mocks__/@codematic.io/cdp-node.ts
export class CDPClient {
  identify = jest.fn().mockResolvedValue(undefined);
  track = jest.fn().mockResolvedValue(undefined);
  sendEmail = jest.fn().mockResolvedValue({ success: true });
  sendPush = jest.fn().mockResolvedValue({ success: true });
  registerDevice = jest.fn().mockResolvedValue(undefined);
  ping = jest.fn().mockResolvedValue(undefined);
  
  constructor(config: any) {
    // Store config if needed for assertions
  }
}
```
<!-- 
### Dependency Injection

Make OpenCDP client injectable for easier testing:

```typescript
// services/userService.ts
import { CDPClient } from '@codematic.io/cdp-node';

export class UserService {
  constructor(private cdpClient: CDPClient) {}
  
  async signupUser(email: string, name: string) {
    const userId = await this.createUser(email, name);
    
    await this.cdpClient.identify(userId, {
      email,
      name,
      created_at: new Date().toISOString()
    });
    
    return userId;
  }
}

// test
import { UserService } from './userService';

describe('UserService', () => {
  test('identifies user on signup', async () => {
    const mockClient = {
      identify: jest.fn().mockResolvedValue(undefined)
    } as any;
    
    const service = new UserService(mockClient);
    await service.signupUser('user@example.com', 'John Doe');
    
    expect(mockClient.identify).toHaveBeenCalled();
  });
});
```

## Testing Patterns

### Test Successful Operations

```typescript
describe('CDPClient', () => {
  test('identify succeeds with valid data', async () => {
    const mockClient = createMockClient();
    
    await expect(
      mockClient.identify('user123', {
        email: 'user@example.com'
      })
    ).resolves.not.toThrow();
    
    expect(mockClient.identify).toHaveBeenCalledTimes(1);
  });
});
```

### Test Error Handling

```typescript
describe('Error Handling', () => {
  test('handles identify failure gracefully', async () => {
    const mockClient = createMockClient();
    mockClient.identify.mockRejectedValue(
      new Error('Network error')
    );
    
    const service = new UserService(mockClient);
    
    await expect(
      service.signupUser('user@example.com', 'John')
    ).rejects.toThrow('Network error');
  });
  
  test('retries on transient errors', async () => {
    const mockClient = createMockClient();
    mockClient.track
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce(undefined);
    
    await service.trackWithRetry('user123', 'event');
    
    expect(mockClient.track).toHaveBeenCalledTimes(2);
  });
});
```

### Test Validation

```typescript
describe('Validation', () => {
  test('throws error for empty identifier', async () => {
    const client = new CDPClient({
      cdpApiKey: 'test-key'
    });
    
    await expect(
      client.identify('', { email: 'user@example.com' })
    ).rejects.toThrow('Identifier cannot be empty');
  });
  
  test('throws error for invalid email', async () => {
    const client = new CDPClient({
      cdpApiKey: 'test-key'
    });
    
    await expect(
      client.sendEmail({
        to: 'invalid-email',
        identifiers: { id: 'user123' },
        transactional_message_id: 'WELCOME'
      })
    ).rejects.toThrow('Invalid email address format');
  });
});
```

## Integration Tests

### Using nock

Mock HTTP requests with nock:

```typescript
import nock from 'nock';
import { CDPClient } from '@codematic.io/cdp-node';

describe('CDPClient Integration', () => {
  let client: CDPClient;
  
  beforeEach(() => {
    client = new CDPClient({
      cdpApiKey: 'test-key',
      cdpEndpoint: 'https://test-api.example.com'
    });
  });
  
  afterEach(() => {
    nock.cleanAll();
  });
  
  test('identify makes correct API request', async () => {
    const scope = nock('https://test-api.example.com')
      .post('/v1/persons/identify', {
        identifier: 'user123',
        properties: {
          email: 'user@example.com',
          name: 'John Doe'
        }
      })
      .reply(200, { success: true });
    
    await client.identify('user123', {
      email: 'user@example.com',
      name: 'John Doe'
    });
    
    expect(scope.isDone()).toBe(true);
  });
  
  test('handles 401 authentication error', async () => {
    nock('https://test-api.example.com')
      .post('/v1/persons/identify')
      .reply(401, { error: 'Invalid API key' });
    
    await expect(
      client.identify('user123', { email: 'user@example.com' })
    ).rejects.toMatchObject({
      response: {
        status: 401
      }
    });
  });
});
```

### Test Environment Setup

Use a test OpenCDP instance:

```typescript
// config/cdp.test.ts
import { CDPClient } from '@codematic.io/cdp-node';

export const createTestClient = () => {
  return new CDPClient({
    cdpApiKey: process.env.CDP_TEST_API_KEY || 'test-key',
    cdpEndpoint: 'https://test-api.opencdp.io/gateway/data-gateway',
    timeout: 5000,
    debug: true
  });
};

// test
describe('Integration Tests', () => {
  let client: CDPClient;
  
  beforeAll(() => {
    client = createTestClient();
  });
  
  test('can ping test server', async () => {
    await expect(client.ping()).resolves.not.toThrow();
  });
});
```

## Test Fixtures

Create reusable test data:

```typescript
// __fixtures__/users.ts
export const mockUser = {
  id: 'user123',
  email: 'test@example.com',
  name: 'Test User',
  plan: 'premium'
};

export const mockEmailRequest = {
  to: mockUser.email,
  identifiers: { id: mockUser.id },
  transactional_message_id: 'WELCOME_EMAIL',
  message_data: {
    name: mockUser.name
  }
};

// test
import { mockUser, mockEmailRequest } from './__fixtures__/users';

test('sends welcome email', async () => {
  await client.sendEmail(mockEmailRequest);
  expect(mockClient.sendEmail).toHaveBeenCalledWith(mockEmailRequest);
});
```

## E2E Testing

### Cypress Example

```typescript
// cypress/integration/signup.spec.ts
describe('User Signup', () => {
  beforeEach(() => {
    // Intercept OpenCDP calls
    cy.intercept('POST', '**/v1/persons/identify', {
      statusCode: 200,
      body: { success: true }
    }).as('identifyUser');
    
    cy.intercept('POST', '**/v1/send/email', {
      statusCode: 200,
      body: { success: true }
    }).as('sendEmail');
  });
  
  it('identifies user and sends welcome email', () => {
    cy.visit('/signup');
    cy.get('[data-testid="email"]').type('user@example.com');
    cy.get('[data-testid="name"]').type('John Doe');
    cy.get('[data-testid="submit"]').click();
    
    // Verify OpenCDP calls
    cy.wait('@identifyUser').its('request.body').should('deep.include', {
      identifier: Cypress.sinon.match.string,
      properties: {
        email: 'user@example.com',
        name: 'John Doe'
      }
    });
    
    cy.wait('@sendEmail');
    cy.url().should('include', '/welcome');
  });
});
```

## Snapshot Testing

Test email templates with snapshots:

```typescript
describe('Email Templates', () => {
  test('welcome email matches snapshot', async () => {
    const request = {
      to: 'user@example.com',
      identifiers: { id: 'user123' },
      transactional_message_id: 'WELCOME_EMAIL',
      message_data: {
        name: 'John Doe',
        activation_link: 'https://example.com/activate/abc'
      }
    };
    
    expect(request).toMatchSnapshot();
  });
});
```

## Performance Testing

Test with many concurrent operations:

```typescript
describe('Performance', () => {
  test('handles 1000 concurrent identifies', async () => {
    const client = new CDPClient({
      cdpApiKey: 'test-key',
      maxConcurrentRequests: 30
    });
    
    const identifyPromises = Array.from({ length: 1000 }, (_, i) =>
      client.identify(`user${i}`, {
        email: `user${i}@example.com`
      })
    );
    
    const startTime = Date.now();
    await Promise.all(identifyPromises);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(30000); // Should complete in 30s
  });
});
```

## Coverage

Aim for high test coverage:

```bash
npm run test:coverage
```

Example coverage goals:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80% -->

## Related

- [Error Handling](./error-handling.md)
- [Best Practices](./best-practices.md)
- [Examples](../examples/basic-usage.md)

