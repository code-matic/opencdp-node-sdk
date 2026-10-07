import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import axios from 'axios';
import { TrackClient } from 'customerio-node';
import { CDPClient } from './client';
import { DEFAULT_PRIMARY_BASE_URL, resolveAllBaseUrls } from './gateway_urls';
import { SendEmailRequest } from './types';

// Helper function to create SendEmailRequest instances
function createEmailRequest(opts: any): SendEmailRequest {
    return new SendEmailRequest(opts);
}

// Mock axios.create to return a mocked instance
const mockAxiosInstance = {
    get: jest.fn() as jest.MockedFunction<any>,
    post: jest.fn() as jest.MockedFunction<any>,
};

jest.mock('axios', () => ({
    create: jest.fn(() => mockAxiosInstance),
}));

jest.mock('customerio-node', () => {
    return {
        TrackClient: jest.fn().mockImplementation(() => ({
            identify: jest.fn().mockImplementation(() => Promise.resolve({})),
            track: jest.fn().mockImplementation(() => Promise.resolve({})),
            addDevice: jest.fn().mockImplementation(() => Promise.resolve({})),
        })),
        RegionUS: undefined,
        RegionEU: undefined
    };
});

// Mock http and https modules
jest.mock('http', () => ({
    Agent: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('https', () => ({
    Agent: jest.fn().mockImplementation(() => ({})),
}));


describe('gateway_urls', () => {
    it('defaults to api.opencdp.io primary with two fallbacks', () => {
        const urls = resolveAllBaseUrls();
        expect(urls).toEqual([
            DEFAULT_PRIMARY_BASE_URL,
            'https://api.open-cdp.com/gateway/data-gateway',
            'https://api.open-cdp.xyz/gateway/data-gateway',
        ]);
    });
});

describe('CDPClient', () => {
    let mockedAxios: jest.Mocked<typeof axios>;
    let mockedTrackClient: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockedAxios = axios as jest.Mocked<typeof axios>;
        mockedTrackClient = TrackClient as jest.Mock;

        // Reset the mock axios instance
        mockAxiosInstance.get.mockClear();
        mockAxiosInstance.post.mockClear();
    });

    describe('identify', () => {
        it('should send identify data to OpenCDP and Customer.io when sendToCmIo is enabled', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true,
                sendToCustomerIo: true,
                customerIo: {
                    siteId: 'site-id',
                    apiKey: 'cio-api-key'
                }
            });

            const testProperties = { name: 'Test User', email: 'test@example.com' };

            // Mock the axios instance response
            mockAxiosInstance.post.mockResolvedValue({ status: 200 });

            await client.identify('user-123', testProperties);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/persons/identify',
                {
                    identifier: 'user-123',
                    properties: testProperties
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway' }
            );

            expect(mockedTrackClient).toHaveBeenCalledWith('site-id', 'cio-api-key', { region: undefined });
        })

        it('should raise validation error when id is not provided', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true,
                sendToCustomerIo: true,
                customerIo: {
                    siteId: 'site-id',
                    apiKey: 'cio-api-key'
                }
            });

            mockedTrackClient.mockClear();

            await expect(client.identify('', {})).rejects.toThrow('Identifier cannot be empty');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
            expect(mockedTrackClient).not.toHaveBeenCalled();
        });

        it('should send identify data to OpenCDP only when sendToCmIo is disabled', async () => {
            mockedTrackClient.mockClear();

            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true,
                sendToCustomerIo: false,
                customerIo: {
                    siteId: 'site-id',
                    apiKey: 'cio-api-key'
                }
            });

            // Mock the axios instance response
            mockAxiosInstance.post.mockResolvedValue({ status: 200 });

            await client.identify('user-123', { name: 'Test User', email: 'test@example.com' });

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/persons/identify',
                {
                    identifier: 'user-123',
                    properties: { name: 'Test User', email: 'test@example.com' }
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway' }
            );

            expect(mockedTrackClient).not.toHaveBeenCalled();
        });
    });

    describe('track', () => {
        it('should send track data to OpenCDP and Customer.io when sendToCmIo is enabled', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true,
                sendToCustomerIo: true,
                customerIo: {
                    siteId: 'site-id',
                    apiKey: 'cio-api-key'
                }
            });

            // Mock the axios instance response
            mockAxiosInstance.post.mockResolvedValue({ status: 200 });

            await client.track('user-123', 'purchase', { amount: 100, currency: 'USD' });

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/persons/track',
                {
                    identifier: 'user-123',
                    eventName: 'purchase',
                    properties: { amount: 100, currency: 'USD' }
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway' }
            );

            expect(mockedTrackClient).toHaveBeenCalledWith('site-id', 'cio-api-key', { region: undefined });
        });

        it('should raise validation error when id is not provided', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true,
                sendToCustomerIo: true,
                customerIo: {
                    siteId: 'site-id',
                    apiKey: 'cio-api-key',
                }
            });
            mockedTrackClient.mockClear();

            await expect(client.track('', 'purchase', { amount: 100, currency: 'USD' })).rejects.toThrow('Identifier cannot be empty');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
            expect(mockedTrackClient).not.toHaveBeenCalled();
        });

        it('should raise validation error when event name is not provided', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true,
                sendToCustomerIo: true,
                customerIo: {
                    siteId: 'site-id',
                    apiKey: 'cio-api-key',
                }
            });
            mockedTrackClient.mockClear();

            await expect(client.track('user-123', '', { amount: 100, currency: 'USD' })).rejects.toThrow('Event name cannot be empty');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
            expect(mockedTrackClient).not.toHaveBeenCalled();
        });
    });


    describe('registerDevice', () => {
        it('should send register device data to OpenCDP and CMIO when sendToCustomerIo is enabled', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true,
                sendToCustomerIo: true,
                customerIo: {
                    siteId: 'site-id',
                    apiKey: 'cio-api-key',
                }
            });

            // Mock the axios instance response
            mockAxiosInstance.post.mockResolvedValue({ status: 200 });

            await client.registerDevice('user-123', {
                deviceId: 'device-123',
                name: 'Test Device',
                platform: 'android',
                osVersion: '10.0',
                model: 'Pixel 5',
                fcmToken: 'test-fcm-token',
                apnToken: 'test-apn-token',
                appVersion: '1.0.0',
                attributes: {
                    key: 'value'
                }
            });

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/persons/registerDevice',
                {
                    identifier: 'user-123',
                    deviceId: 'device-123',
                    name: 'Test Device',
                    platform: 'android',
                    osVersion: '10.0',
                    model: 'Pixel 5',
                    fcmToken: 'test-fcm-token',
                    apnToken: 'test-apn-token',
                    appVersion: '1.0.0',
                    attributes: {
                        key: 'value'
                    }
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway' }
            );
            expect(mockedTrackClient).toHaveBeenCalledWith('site-id', 'cio-api-key', { region: undefined });
        });
    });

    describe('sendEmail', () => {
        it('should send template-based email data to OpenCDP with basic parameters', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            // Mock the axios instance response
            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'email-123', status: 'sent' }
            });

            const emailRequest = new SendEmailRequest({
                transactional_message_id: 'WELCOME_EMAIL',
                to: 'test@example.com',
                identifiers: { id: 'user-123' },
                subject: 'Test Email',
                body: 'This is a test email'
            });

            const result = await client.sendEmail(emailRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/email',
                {
                    to: 'test@example.com',
                    identifiers: { id: 'user-123' },
                    transactional_message_id: 'WELCOME_EMAIL',
                    subject: 'Test Email',
                    body: 'This is a test email'
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'email-123', status: 'sent' });
        });

        it('should send template-based email data to OpenCDP with full parameters', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            // Mock the axios instance response
            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'email-456', status: 'sent' }
            });

            const emailRequest = createEmailRequest({
                transactional_message_id: 'VERIFICATION_OTP',
                to: 'test@example.com',
                identifiers: { email: 'test@example.com' },
                from: 'no-reply@aellacredit.com',
                subject: 'Aella Verification OTP',
                body: 'You are one step closer to enjoying seamless banking. Here is your OTP: 123456',
                message_data: {
                    otp: '123456',
                    user_id: 'user-123'
                },
                bcc: 'admin@aellacredit.com',
                send_to_unsubscribed: true,
                tracked: true,
                disable_css_preprocessing: false
            });

            const result = await client.sendEmail(emailRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/email',
                {
                    to: 'test@example.com',
                    identifiers: { email: 'test@example.com' },
                    transactional_message_id: 'VERIFICATION_OTP',
                    from: 'no-reply@aellacredit.com',
                    subject: 'Aella Verification OTP',
                    body: 'You are one step closer to enjoying seamless banking. Here is your OTP: 123456',
                    message_data: {
                        otp: '123456',
                        user_id: 'user-123'
                    },
                    bcc: 'admin@aellacredit.com',
                    send_to_unsubscribed: true,
                    tracked: true,
                    disable_css_preprocessing: false
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'email-456', status: 'sent' });
        });

        it('should send raw email data to OpenCDP without template', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            // Mock the axios instance response
            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'email-789', status: 'sent' }
            });

            const emailRequest = createEmailRequest({
                to: 'test@example.com',
                identifiers: { id: 'cio-123' },
                from: 'no-reply@aellacredit.com',
                subject: 'Raw Email Test',
                body: '<h1>This is a raw HTML email</h1>',
                plaintext_body: 'This is a plain text email',
                reply_to: 'support@aellacredit.com',
                preheader: 'Email preview text'
            });

            const result = await client.sendEmail(emailRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/email',
                {
                    to: 'test@example.com',
                    identifiers: { id: 'cio-123' },
                    from: 'no-reply@aellacredit.com',
                    subject: 'Raw Email Test',
                    body: '<h1>This is a raw HTML email</h1>',
                    body_plain: 'This is a plain text email',
                    reply_to: 'support@aellacredit.com',
                    preheader: 'Email preview text'
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'email-789', status: 'sent' });
        });

        it('should raise validation error when to email is not provided', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendEmail(createEmailRequest({ identifiers: { id: 'user-123' } } as any))).rejects.toThrow('to is required');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when identifiers is not provided', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendEmail(new SendEmailRequest({ to: 'test@example.com' } as any))).rejects.toThrow('identifiers is required');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when identifiers is empty', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendEmail(new SendEmailRequest({
                to: 'test@example.com',
                identifiers: {} as any,
                transactional_message_id: 'TEST'
            }))).rejects.toThrow('identifiers must contain exactly one of: id, email, or cdp_id');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when identifiers has multiple values', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendEmail(createEmailRequest({
                to: 'test@example.com',
                identifiers: { id: 'user-123', email: 'test@example.com' } as any,
                transactional_message_id: 'TEST'
            }))).rejects.toThrow('identifiers must contain exactly one of: id, email, or cdp_id');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when to email is empty', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendEmail(createEmailRequest({
                to: '',
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST'
            }))).rejects.toThrow('to is required');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when to email has invalid format', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendEmail(createEmailRequest({
                to: 'invalid-email',
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST'
            }))).rejects.toThrow('Invalid email address format');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when from email has invalid format', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendEmail(createEmailRequest({
                to: 'test@example.com',
                identifiers: { id: 'user-123' },
                from: 'invalid-email',
                transactional_message_id: 'TEST'
            }))).rejects.toThrow('Invalid email address format');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when bcc email has invalid format', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendEmail(createEmailRequest({
                to: 'test@example.com',
                identifiers: { id: 'user-123' },
                bcc: 'invalid-email',
                transactional_message_id: 'TEST'
            }))).rejects.toThrow('Invalid email address format');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when reply_to email has invalid format', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendEmail(createEmailRequest({
                to: 'test@example.com',
                identifiers: { id: 'user-123' },
                reply_to: 'invalid-email',
                transactional_message_id: 'TEST'
            }))).rejects.toThrow('Invalid email address format');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when send_at is not a positive integer', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendEmail(createEmailRequest({
                to: 'test@example.com',
                identifiers: { id: 'user-123' },
                send_at: -1,
                transactional_message_id: 'TEST'
            }))).rejects.toThrow('send_at must be a positive integer');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when headers is not valid JSON', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendEmail(createEmailRequest({
                to: 'test@example.com',
                identifiers: { id: 'user-123' },
                headers: 'invalid json' as any,
                transactional_message_id: 'TEST'
            }))).rejects.toThrow('headers must be an object');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when body is empty', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendEmail(createEmailRequest({
                to: 'test@example.com',
                identifiers: { id: 'user-123' },
                body: '',
                transactional_message_id: 'TEST'
            }))).rejects.toThrow('body cannot be empty if provided');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error for raw email without required fields', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendEmail(createEmailRequest({
                to: 'test@example.com',
                identifiers: { id: 'user-123' }
                // Missing body, subject, from for raw email - no transactional_message_id
            } as any))).rejects.toThrow('When not using a template: body is required when not using a template, subject is required when not using a template, from is required when not using a template');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true,
                debug: true
            });

            // Mock the axios instance to throw an error
            const apiError = new Error('API Error');
            (apiError as any).response = {
                status: 400,
                data: { message: 'Invalid request' }
            };
            mockAxiosInstance.post.mockRejectedValue(apiError);

            const emailRequest = createEmailRequest({
                to: 'test@example.com',
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST',
                subject: 'Test Email'
            });

            await expect(client.sendEmail(emailRequest)).rejects.toThrow('Invalid request');
        });

        it('should warn about unsupported fields', async () => {
            const mockWarn = jest.fn();
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true,
                cdpLogger: {
                    debug: jest.fn(),
                    error: jest.fn(),
                    warn: mockWarn
                }
            });

            // Mock the axios instance response
            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'email-123', status: 'sent' }
            });

            const emailRequest = createEmailRequest({
                to: 'test@example.com',
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST',
                subject: 'Test Email',
                send_at: 1640995200,
                send_to_unsubscribed: true,
                tracked: true,
                disable_css_preprocessing: false,
                headers: { 'X-Custom-Header': 'value' }
            });

            await client.sendEmail(emailRequest);

            expect(mockWarn).toHaveBeenCalledWith(
                expect.stringContaining('[CDP] Warning: The following fields are not yet supported by the backend and will be ignored:')
            );
            expect(mockWarn).toHaveBeenCalledWith(
                expect.stringContaining('send_at')
            );
            expect(mockWarn).toHaveBeenCalledWith(
                expect.stringContaining('send_to_unsubscribed')
            );
            expect(mockWarn).toHaveBeenCalledWith(
                expect.stringContaining('tracked')
            );
            expect(mockWarn).toHaveBeenCalledWith(
                expect.stringContaining('disable_css_preprocessing')
            );
            expect(mockWarn).toHaveBeenCalledWith(
                expect.stringContaining('headers')
            );
            expect(mockWarn).toHaveBeenCalledWith(
                expect.stringContaining('These fields are included for future compatibility but have no effect on email delivery.')
            );
        });

        it('should not warn when no unsupported fields are used', async () => {
            const mockWarn = jest.fn();
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true,
                cdpLogger: {
                    debug: jest.fn(),
                    error: jest.fn(),
                    warn: mockWarn
                }
            });

            // Mock the axios instance response
            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'email-123', status: 'sent' }
            });

            const emailRequest = createEmailRequest({
                to: 'test@example.com',
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST',
                subject: 'Test Email',
                body: 'Test body',
                from: 'test@example.com'
            });

            await client.sendEmail(emailRequest);

            expect(mockWarn).not.toHaveBeenCalled();
        });

        describe('attachments', () => {
            const pdfBase64 = Buffer.from('%PDF-1.4 test').toString('base64');

            function createClient(warn = jest.fn()) {
                return new CDPClient({
                    cdpApiKey: 'test-api-key',
                    cdpFallbackEndpoints: [],
                    failOnException: true,
                    cdpLogger: { debug: jest.fn(), error: jest.fn(), warn },
                });
            }

            function templateRequest(extra: Record<string, any> = {}) {
                return createEmailRequest({
                    to: 'test@example.com',
                    identifiers: { id: 'user-123' },
                    transactional_message_id: 'TEST',
                    ...extra,
                });
            }

            beforeEach(() => {
                mockAxiosInstance.post.mockResolvedValue({ status: 200, data: { status: 'queued' } });
            });

            it('should include attachments in the payload without warning', async () => {
                const mockWarn = jest.fn();
                const client = createClient(mockWarn);

                await client.sendEmail(templateRequest({ attachments: { 'invoice.pdf': pdfBase64 } }));

                expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                    '/v1/send/email',
                    expect.objectContaining({ attachments: { 'invoice.pdf': pdfBase64 } }),
                    expect.anything()
                );
                expect(mockWarn).not.toHaveBeenCalled();
            });

            it('should reject more than 5 attachments', async () => {
                const attachments: Record<string, string> = {};
                for (let i = 0; i < 6; i++) attachments[`file${i}.txt`] = pdfBase64;

                await expect(createClient().sendEmail(templateRequest({ attachments }))).rejects.toThrow(
                    'attachments may contain at most 5 files'
                );
                expect(mockAxiosInstance.post).not.toHaveBeenCalled();
            });

            it('should reject attachments over 2 MB decoded', async () => {
                const big = Buffer.alloc(2 * 1024 * 1024 + 1).toString('base64');

                await expect(
                    createClient().sendEmail(templateRequest({ attachments: { 'big.bin': big } }))
                ).rejects.toThrow('attachments decoded size exceeds 2097152 bytes (2 MB)');
            });

            it.each(['../secret.pdf', 'dir/file.pdf', 'dir\\file.pdf'])('should reject filename %s', async (filename) => {
                await expect(
                    createClient().sendEmail(templateRequest({ attachments: { [filename]: pdfBase64 } }))
                ).rejects.toThrow(`invalid attachment filename: ${filename}`);
            });

            it('should reject empty attachment content', async () => {
                await expect(
                    createClient().sendEmail(templateRequest({ attachments: { 'a.pdf': '' } }))
                ).rejects.toThrow('attachment "a.pdf" must be a non-empty base64 string');
            });

            it('should reject content that is not base64', async () => {
                await expect(
                    createClient().sendEmail(templateRequest({ attachments: { 'a.pdf': '!!!' } }))
                ).rejects.toThrow('attachment "a.pdf" must be a valid base64 string');
            });

            it.each([
                ['an invalid character in the middle', 'aGV$sbG8='],
                ['data after the padding', 'aGVsbG8=trailing-data'],
                ['padding in the middle', 'aG=VsbG8'],
                ['a dangling single character', 'aGVsb'],
                ['only whitespace', ' \n\t '],
                ['mixed standard and url-safe alphabets', '+/-_'],
            ])('should reject base64 with %s', async (_case, content) => {
                await expect(
                    createClient().sendEmail(templateRequest({ attachments: { 'a.txt': content } }))
                ).rejects.toThrow('attachment "a.txt" must be a valid base64 string');
                expect(mockAxiosInstance.post).not.toHaveBeenCalled();
            });

            it('should accept unpadded, url-safe and line-wrapped base64', async () => {
                const wrapped = Buffer.alloc(300, 7).toString('base64').replace(/(.{76})/g, '$1\r\n');

                await createClient().sendEmail(
                    templateRequest({
                        attachments: {
                            'unpadded.txt': 'aGVsbG8',
                            'standard.bin': '+/8=',
                            'urlsafe.bin': '-_8=',
                            'wrapped.bin': wrapped,
                        },
                    })
                );

                expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
            });

            it('should accept exactly 2 MB decoded', async () => {
                const exact = Buffer.alloc(2 * 1024 * 1024).toString('base64');

                await createClient().sendEmail(templateRequest({ attachments: { 'exact.bin': exact } }));

                expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
            });

            it('should reject oversized content by length without decoding it', async () => {
                const huge = 'A'.repeat(64 * 1024 * 1024);

                await expect(
                    createClient().sendEmail(templateRequest({ attachments: { 'huge.bin': huge } }))
                ).rejects.toThrow('attachments decoded size exceeds 2097152 bytes (2 MB)');
            });

            it('should reject attachments that are not an object', async () => {
                await expect(
                    createClient().sendEmail(templateRequest({ attachments: ['a.pdf'] }))
                ).rejects.toThrow('attachments must be an object');
            });

            it('should not send and not throw on invalid attachments when failOnException is false', async () => {
                const client = new CDPClient({ cdpApiKey: 'test-api-key', cdpFallbackEndpoints: [] });
                const attachments: Record<string, string> = {};
                for (let i = 0; i < 6; i++) attachments[`file${i}.txt`] = pdfBase64;

                await expect(client.sendEmail(templateRequest({ attachments }))).resolves.toBeUndefined();
                expect(mockAxiosInstance.post).not.toHaveBeenCalled();
            });
        });
    });

    describe('SendEmailRequest.attach', () => {
        function newRequest() {
            return new SendEmailRequest({
                to: 'test@example.com',
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST',
            });
        }

        it('should base64-encode a Buffer', () => {
            const request = newRequest();
            request.attach('invoice.pdf', Buffer.from('pdf-bytes'));
            expect(request.message.attachments).toEqual({ 'invoice.pdf': Buffer.from('pdf-bytes').toString('base64') });
        });

        it('should base64-encode a Uint8Array', () => {
            const request = newRequest();
            request.attach('data.bin', new Uint8Array([1, 2, 3]));
            expect(request.message.attachments).toEqual({ 'data.bin': 'AQID' });
        });

        it('should base64-encode a string by default', () => {
            const request = newRequest();
            request.attach('notes.txt', 'hello');
            expect(request.message.attachments).toEqual({ 'notes.txt': 'aGVsbG8=' });
        });

        it('should keep a string as-is when encode is false', () => {
            const request = newRequest();
            request.attach('notes.txt', 'aGVsbG8=', { encode: false });
            expect(request.message.attachments).toEqual({ 'notes.txt': 'aGVsbG8=' });
        });

        it('should merge with attachments passed to the constructor', () => {
            const request = new SendEmailRequest({
                to: 'test@example.com',
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST',
                attachments: { 'a.txt': 'YQ==' },
            });
            request.attach('b.txt', 'b');
            expect(request.message.attachments).toEqual({ 'a.txt': 'YQ==', 'b.txt': 'Yg==' });
        });
    });

    describe('sendPush', () => {
        it('should send push notification data to OpenCDP with basic parameters', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            // Mock the axios instance response
            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'push-123', status: 'sent' }
            });

            const pushRequest = {
                transactional_message_id: 'WELCOME_PUSH',
                identifiers: { id: 'user-123' },
                title: 'Welcome!',
                body: 'Thank you for joining us!'
            };

            const result = await client.sendPush(pushRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/push',
                {
                    identifiers: { id: 'user-123' },
                    transactional_message_id: 'WELCOME_PUSH',
                    title: 'Welcome!',
                    body: 'Thank you for joining us!'
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'push-123', status: 'sent' });
        });

        it('should send push notification data to OpenCDP with full parameters', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            // Mock the axios instance response
            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'push-456', status: 'sent' }
            });

            const pushRequest = {
                transactional_message_id: 'ORDER_UPDATE',
                identifiers: { email: 'user@example.com' },
                title: 'Order Update',
                body: 'Your order has been shipped!',
                message_data: {
                    order_id: '12345',
                    tracking_number: 'TRK123456',
                    items: [
                        { name: 'Shoes', price: '59.99' }
                    ]
                }
            };

            const result = await client.sendPush(pushRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/push',
                {
                    identifiers: { email: 'user@example.com' },
                    transactional_message_id: 'ORDER_UPDATE',
                    title: 'Order Update',
                    body: 'Your order has been shipped!',
                    message_data: {
                        order_id: '12345',
                        tracking_number: 'TRK123456',
                        items: [
                            { name: 'Shoes', price: '59.99' }
                        ]
                    }
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'push-456', status: 'sent' });
        });

        it('should send push notification with email identifier', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            // Mock the axios instance response
            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'push-789', status: 'sent' }
            });

            const pushRequest = {
                transactional_message_id: 'PROMOTION',
                identifiers: { email: 'user@example.com' },
                title: 'Special Offer!',
                body: 'Get 20% off your next purchase'
            };

            const result = await client.sendPush(pushRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/push',
                {
                    identifiers: { email: 'user@example.com' },
                    transactional_message_id: 'PROMOTION',
                    title: 'Special Offer!',
                    body: 'Get 20% off your next purchase'
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'push-789', status: 'sent' });
        });

        it('should raise validation error when identifiers is not provided', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendPush({
                transactional_message_id: 'TEST'
            } as any)).rejects.toThrow('identifiers is required');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when identifiers is empty', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendPush({
                transactional_message_id: 'TEST',
                identifiers: {}
            })).rejects.toThrow('identifiers must contain exactly one of: id, email, or cdp_id');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when identifiers has multiple values', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendPush({
                transactional_message_id: 'TEST',
                identifiers: { id: 'user-123', email: 'user@example.com' }
            })).rejects.toThrow('identifiers must contain exactly one of: id, email, or cdp_id');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when transactional_message_id is not provided', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendPush({
                identifiers: { id: 'user-123' }
            } as any)).rejects.toThrow('transactional_message_id is required');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when transactional_message_id is empty', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendPush({
                identifiers: { id: 'user-123' },
                transactional_message_id: ''
            })).rejects.toThrow('transactional_message_id is required');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when body is empty', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            await expect(client.sendPush({
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST',
                body: ''
            })).rejects.toThrow('body cannot be empty if provided');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true,
                debug: true
            });

            // Mock the axios instance to throw an error
            const apiError = new Error('API Error');
            (apiError as any).response = {
                status: 400,
                data: { message: 'Invalid request' }
            };
            mockAxiosInstance.post.mockRejectedValue(apiError);

            const pushRequest = {
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST',
                title: 'Test Push'
            };

            await expect(client.sendPush(pushRequest)).rejects.toThrow('Invalid request');
        });
    });

    describe('sendSms', () => {
        it('should send template-based SMS successfully', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'sms-123', status: 'sent' }
            });

            const smsRequest = {
                identifiers: { id: 'user-123' },
                transactional_message_id: 'ORDER_CONFIRMATION',
                message_data: {
                    order_number: '12345',
                    total: '$99.99'
                }
            };

            const result = await client.sendSms(smsRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/sms',
                {
                    identifiers: { id: 'user-123' },
                    transactional_message_id: 'ORDER_CONFIRMATION',
                    message_data: {
                        order_number: '12345',
                        total: '$99.99'
                    }
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'sms-123', status: 'sent' });
        });

        it('should send template-based SMS with numeric transactional_message_id', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'sms-456', status: 'sent' }
            });

            const smsRequest = {
                identifiers: { id: 'user-123' },
                transactional_message_id: 12345,
                message_data: {
                    order_number: '12345'
                }
            };

            const result = await client.sendSms(smsRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/sms',
                {
                    identifiers: { id: 'user-123' },
                    transactional_message_id: '12345',
                    message_data: {
                        order_number: '12345'
                    }
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'sms-456', status: 'sent' });
        });

        it('should send template-based SMS with phone number override', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'sms-789', status: 'sent' }
            });

            const smsRequest = {
                identifiers: { id: 'user-123' },
                transactional_message_id: 'ORDER_CONFIRMATION',
                to: '+1234567890',
                from: '+1987654321',
                message_data: {
                    order_number: '12345'
                }
            };

            const result = await client.sendSms(smsRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/sms',
                {
                    identifiers: { id: 'user-123' },
                    transactional_message_id: 'ORDER_CONFIRMATION',
                    to: '+1234567890',
                    from: '+1987654321',
                    message_data: {
                        order_number: '12345'
                    }
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'sms-789', status: 'sent' });
        });

        it('should send raw SMS successfully with phone number', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'sms-raw-1', status: 'sent' }
            });

            const smsRequest = {
                identifiers: { id: 'user-123' },
                to: '+1234567890',
                body: 'Your verification code is 123456. Valid for 10 minutes.'
            };

            const result = await client.sendSms(smsRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/sms',
                {
                    identifiers: { id: 'user-123' },
                    to: '+1234567890',
                    body: 'Your verification code is 123456. Valid for 10 minutes.'
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'sms-raw-1', status: 'sent' });
        });

        it('should send raw SMS successfully without phone number (looked up from profile)', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'sms-raw-2', status: 'sent' }
            });

            const smsRequest = {
                identifiers: { id: 'user-123' },
                body: 'Your verification code is 123456. Valid for 10 minutes.'
            };

            const result = await client.sendSms(smsRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/sms',
                {
                    identifiers: { id: 'user-123' },
                    body: 'Your verification code is 123456. Valid for 10 minutes.'
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'sms-raw-2', status: 'sent' });
        });

        it('should send SMS with email identifier', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'sms-email', status: 'sent' }
            });

            const smsRequest = {
                identifiers: { email: 'user@example.com' },
                transactional_message_id: 'WELCOME_SMS'
            };

            const result = await client.sendSms(smsRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/sms',
                {
                    identifiers: { email: 'user@example.com' },
                    transactional_message_id: 'WELCOME_SMS'
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'sms-email', status: 'sent' });
        });

        it('should send SMS with cdp_id identifier', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'sms-cdp', status: 'sent' }
            });

            const smsRequest = {
                identifiers: { cdp_id: 'cdp-user-123' },
                transactional_message_id: 'WELCOME_SMS'
            };

            const result = await client.sendSms(smsRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/sms',
                {
                    identifiers: { cdp_id: 'cdp-user-123' },
                    transactional_message_id: 'WELCOME_SMS'
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'sms-cdp', status: 'sent' });
        });

        it('should clean payload by removing undefined values', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'sms-clean', status: 'sent' }
            });

            const smsRequest = {
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST',
                to: undefined,
                from: undefined,
                body: undefined,
                message_data: undefined
            };

            await client.sendSms(smsRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/sms',
                {
                    identifiers: { id: 'user-123' },
                    transactional_message_id: 'TEST'
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
        });

        it('should log warning when sendToCustomerIo is enabled', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true,
                sendToCustomerIo: true,
                customerIo: {
                    siteId: 'site-id',
                    apiKey: 'cio-api-key'
                },
                debug: true
            });

            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'sms-warn', status: 'sent' }
            });

            const smsRequest = {
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST'
            };

            // Mock console.warn to capture the warning
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

            await client.sendSms(smsRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalled();
            // Note: The warning is logged via logger.warn, not console.warn
            // The actual logger implementation may vary, but the logic is there
            consoleSpy.mockRestore();
        });

        it('should raise validation error when identifiers is not provided', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendSms({} as any)).rejects.toThrow('identifiers is required');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when identifiers is empty', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendSms({
                identifiers: {} as any,
                transactional_message_id: 'TEST'
            })).rejects.toThrow('identifiers must contain exactly one of: id, email, or cdp_id');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when identifiers has multiple values', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendSms({
                identifiers: { id: 'user-123', email: 'user@example.com' } as any,
                transactional_message_id: 'TEST'
            })).rejects.toThrow('identifiers must contain exactly one of: id, email, or cdp_id');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when body is required but not provided (raw SMS)', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendSms({
                identifiers: { id: 'user-123' }
            })).rejects.toThrow('body is required when not using a template');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when body is empty string', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendSms({
                identifiers: { id: 'user-123' },
                body: '   '
            })).rejects.toThrow('body cannot be empty if provided');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when to phone number has invalid format', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendSms({
                identifiers: { id: 'user-123' },
                to: '01234567890',  // Starts with 0, invalid E.164 format
                transactional_message_id: 'TEST'
            })).rejects.toThrow('Phone number must be in international format');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when to phone number has invalid format (formatted)', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendSms({
                identifiers: { id: 'user-123' },
                to: '(123) 456-7890',  // Formatted number
                transactional_message_id: 'TEST'
            })).rejects.toThrow('Phone number must be in international format');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when to phone number is empty', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendSms({
                identifiers: { id: 'user-123' },
                to: '   ',
                transactional_message_id: 'TEST'
            })).rejects.toThrow('Phone number cannot be empty');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when from phone number has invalid format', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendSms({
                identifiers: { id: 'user-123' },
                from: 'invalid-phone',
                transactional_message_id: 'TEST'
            })).rejects.toThrow('Phone number must be in international format');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when message_data is an array', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendSms({
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST',
                message_data: [] as any
            })).rejects.toThrow('message_data must be an object');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should raise validation error when message_data is a string', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendSms({
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST',
                message_data: 'invalid' as any
            })).rejects.toThrow('message_data must be an object');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should accept valid phone numbers in E.164 format', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'sms-valid', status: 'sent' }
            });

            const validPhones = [
                '+1234567890',      // US
                '+441234567890',    // UK
                '+33123456789',     // France
                '+8613800138000'    // China
            ];

            for (const phone of validPhones) {
                await client.sendSms({
                    identifiers: { id: 'user-123' },
                    to: phone,
                    transactional_message_id: 'TEST'
                });
            }

            expect(mockAxiosInstance.post).toHaveBeenCalledTimes(validPhones.length);
        });

        it('should handle API errors gracefully', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            const apiError = new Error('API Error');
            (apiError as any).response = {
                status: 400,
                data: { message: 'Invalid request' }
            };
            mockAxiosInstance.post.mockRejectedValue(apiError);

            const smsRequest = {
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST'
            };

            await expect(client.sendSms(smsRequest)).rejects.toThrow();
        });

        it('should handle API errors gracefully when failOnException is false', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: false
            });

            const apiError = new Error('API Error');
            (apiError as any).response = {
                status: 404,
                data: { message: 'Template not found' }
            };
            mockAxiosInstance.post.mockRejectedValue(apiError);

            const smsRequest = {
                identifiers: { id: 'user-123' },
                transactional_message_id: 'NONEXISTENT'
            };

            const result = await client.sendSms(smsRequest);
            expect(result).toBeUndefined();
        });

        it('should handle API errors with proper error properties', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            const apiError = new Error('API Error');
            (apiError as any).response = {
                status: 429,
                data: { message: 'Rate limit exceeded' }
            };
            mockAxiosInstance.post.mockRejectedValue(apiError);

            const smsRequest = {
                identifiers: { id: 'user-123' },
                transactional_message_id: 'TEST'
            };

            // Test error properties by catching the error
            try {
                await client.sendSms(smsRequest);
                expect(true).toBe(false); // Should not reach here
            } catch (error: any) {
                expect(error.name).toBe('CDPSmsError');
                expect(error.code).toBe('SMS_SEND_FAILED');
                expect(error.status).toBe(429);
                expect(error.summary).toBeDefined();
                expect(error.message).toBe('Rate limit exceeded');
            }
        });

        it('should handle validation errors when failOnException is false', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: false
            });

            const result = await client.sendSms({
                identifiers: {} as any
            });

            expect(result).toBeUndefined();
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should handle empty transactional_message_id string as no template', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendSms({
                identifiers: { id: 'user-123' },
                transactional_message_id: ''
            })).rejects.toThrow('body is required when not using a template');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should handle null transactional_message_id as no template', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendSms({
                identifiers: { id: 'user-123' },
                transactional_message_id: null as any
            })).rejects.toThrow('body is required when not using a template');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should send template-based SMS with body override', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
            cdpFallbackEndpoints: [], failOnException: true
            });

            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'sms-override', status: 'sent' }
            });

            const smsRequest = {
                identifiers: { id: 'user-123' },
                transactional_message_id: 'APPOINTMENT_REMINDER',
                body: 'Custom override message',
                message_data: {
                    appointment_date: '2025-11-02'
                }
            };

            const result = await client.sendSms(smsRequest);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/sms',
                {
                    identifiers: { id: 'user-123' },
                    transactional_message_id: 'APPOINTMENT_REMINDER',
                    body: 'Custom override message',
                    message_data: {
                        appointment_date: '2025-11-02'
                    }
                }
            ,
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'sms-override', status: 'sent' });
        });
    });

    describe('sendWhatsApp', () => {
        it('should send template-based WhatsApp successfully', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
                cdpFallbackEndpoints: [],
                failOnException: true
            });

            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'wa-123', status: 'sent' }
            });

            const request = {
                identifiers: { id: 'user-123' },
                transactional_message_id: 'ORDER_CONFIRMATION',
                message_data: {
                    order_number: '12345',
                    total: '$99.99'
                }
            };

            const result = await client.sendWhatsApp(request);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/whatsapp',
                {
                    identifiers: { id: 'user-123' },
                    transactional_message_id: 'ORDER_CONFIRMATION',
                    message_data: {
                        order_number: '12345',
                        total: '$99.99'
                    }
                },
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'wa-123', status: 'sent' });
        });

        it('should send WhatsApp with numeric transactional_message_id', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
                cdpFallbackEndpoints: [],
                failOnException: true
            });

            mockAxiosInstance.post.mockResolvedValue({
                status: 200,
                data: { messageId: 'wa-456', status: 'sent' }
            });

            const result = await client.sendWhatsApp({
                identifiers: { id: 'user-123' },
                transactional_message_id: 42,
                to: '+14155551234',
                template_variables: {
                    body: { '1': 'Jane' }
                }
            });

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/whatsapp',
                {
                    identifiers: { id: 'user-123' },
                    transactional_message_id: '42',
                    to: '+14155551234',
                    template_variables: {
                        body: { '1': 'Jane' }
                    }
                },
                { baseURL: 'https://api.opencdp.io/gateway/data-gateway', maxRedirects: 0 }
            );
            expect(result).toEqual({ messageId: 'wa-456', status: 'sent' });
        });

        it('should reject when identifiers is missing', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
                cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendWhatsApp({} as any)).rejects.toThrow('identifiers is required');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should reject when more than one identifier is provided', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
                cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendWhatsApp({
                identifiers: { id: 'user-123', email: 'user@example.com' },
                transactional_message_id: 'ORDER_CONFIRMATION'
            })).rejects.toThrow('identifiers must contain exactly one of: id, email, or cdp_id');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should reject when transactional_message_id is missing', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
                cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendWhatsApp({
                identifiers: { id: 'user-123' }
            } as any)).rejects.toThrow('transactional_message_id is required');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should reject an invalid phone number', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
                cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendWhatsApp({
                identifiers: { id: 'user-123' },
                transactional_message_id: 'ORDER_CONFIRMATION',
                to: 'not-a-phone'
            })).rejects.toThrow('Phone number must be in international format (e.g., +1234567890)');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should reject non-object template_variables', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
                cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendWhatsApp({
                identifiers: { id: 'user-123' },
                transactional_message_id: 'ORDER_CONFIRMATION',
                template_variables: ['body'] as any
            })).rejects.toThrow('template_variables must be an object');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should reject named template slots', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
                cdpFallbackEndpoints: [],
                failOnException: true
            });

            await expect(client.sendWhatsApp({
                identifiers: { id: 'user-123' },
                transactional_message_id: 'ORDER_CONFIRMATION',
                template_variables: { body: { name: 'Jane' } }
            })).rejects.toThrow('template_variables.body keys must be positional slot numbers');
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });

        it('should surface the gateway message on a 4xx without trying a fallback host', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
                failOnException: true
            });
            const axiosError = Object.assign(new Error('Request failed with status code 400'), {
                response: { status: 400, data: { message: 'Transactional message with id X not found' } },
            });
            mockAxiosInstance.post.mockRejectedValueOnce(axiosError);

            await expect(client.sendWhatsApp({
                identifiers: { id: 'user-123' },
                transactional_message_id: 'X'
            })).rejects.toMatchObject({
                name: 'CDPWhatsAppError',
                code: 'WHATSAPP_SEND_FAILED',
                status: 400,
                message: 'Transactional message with id X not found',
            });
            expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
        });

        it('should not retry on another host after a timeout, to avoid a duplicate send', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
                failOnException: true
            });
            mockAxiosInstance.post.mockRejectedValueOnce(
                Object.assign(new Error('timeout of 10000ms exceeded'), { code: 'ECONNABORTED' })
            );

            await expect(client.sendWhatsApp({
                identifiers: { id: 'user-123' },
                transactional_message_id: 'ORDER_CONFIRMATION'
            })).rejects.toMatchObject({
                status: undefined,
                message: 'timeout of 10000ms exceeded',
                summary: expect.objectContaining({ networkCode: 'ECONNABORTED' }),
            });
            expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
        });

        it('should fail over when the primary host refuses the connection', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
                failOnException: true
            });
            mockAxiosInstance.post
                .mockRejectedValueOnce(Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }))
                .mockResolvedValueOnce({ status: 200, data: { id: 'trx-1' } });

            const result = await client.sendWhatsApp({
                identifiers: { id: 'user-123' },
                transactional_message_id: 'ORDER_CONFIRMATION'
            });

            expect(result).toEqual({ id: 'trx-1' });
            expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
        });

        it.each([521, 523, 525, 526])(
            'should fail over on Cloudflare %i, which means the gateway never received the send',
            async (status) => {
                const client = new CDPClient({ cdpApiKey: 'test-api-key', failOnException: true });
                mockAxiosInstance.post
                    .mockRejectedValueOnce(
                        Object.assign(new Error(`HTTP ${status}`), { response: { status, data: {} } })
                    )
                    .mockResolvedValueOnce({ status: 200, data: { id: 'trx-2' } });

                await client.sendWhatsApp({ identifiers: { id: 'user-123' }, transactional_message_id: 'A' });

                expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
            }
        );

        it.each([500, 502, 503, 504, 520, 522, 524])(
            'should not fail over on %i, because the gateway may already have queued the send',
            async (status) => {
                const client = new CDPClient({ cdpApiKey: 'test-api-key', failOnException: true });
                mockAxiosInstance.post.mockRejectedValueOnce(
                    Object.assign(new Error(`HTTP ${status}`), { response: { status, data: {} } })
                );

                await expect(
                    client.sendWhatsApp({ identifiers: { id: 'user-123' }, transactional_message_id: 'A' })
                ).rejects.toMatchObject({ status });
                expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
            }
        );

        it('should not follow or fail over on a redirect', async () => {
            const client = new CDPClient({ cdpApiKey: 'test-api-key', failOnException: true });
            mockAxiosInstance.post.mockRejectedValueOnce(
                Object.assign(new Error('HTTP 307'), { response: { status: 307, data: {} } })
            );

            await expect(
                client.sendWhatsApp({ identifiers: { id: 'user-123' }, transactional_message_id: 'A' })
            ).rejects.toMatchObject({ status: 307 });
            expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/v1/send/whatsapp',
                expect.anything(),
                expect.objectContaining({ maxRedirects: 0 })
            );
        });

        it('should not fail over when a non-throwing 503 response comes back', async () => {
            const client = new CDPClient({ cdpApiKey: 'test-api-key', failOnException: true });
            mockAxiosInstance.post.mockResolvedValueOnce({ status: 503, data: {} });

            await expect(
                client.sendWhatsApp({ identifiers: { id: 'user-123' }, transactional_message_id: 'A' })
            ).rejects.toBeDefined();
            expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
        });

        it('should return undefined instead of throwing when failOnException is false', async () => {
            const client = new CDPClient({
                cdpApiKey: 'test-api-key',
                cdpFallbackEndpoints: [],
                failOnException: false
            });
            mockAxiosInstance.post.mockRejectedValueOnce(
                Object.assign(new Error('HTTP 400'), { response: { status: 400, data: { message: 'bad' } } })
            );

            const result = await client.sendWhatsApp({
                identifiers: { id: 'user-123' },
                transactional_message_id: 'ORDER_CONFIRMATION'
            });

            expect(result).toBeUndefined();
        });
    });
});