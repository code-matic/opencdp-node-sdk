export interface CDPConfig {
    // Your OpenCDP platform config
    /**
     * API key for the CDP.
     * This is required for authentication.
     */
    cdpApiKey: string;
    /**
     * Base URL for the OpenCDP API.
     * If not provided, defaults to cdp server.
     */
    cdpEndpoint?: string;
    /**
     * Logger for OpenCDP operations.
     * If not provided, defaults to console logging.
     */
    cdpLogger?: Logger;
    /**
     * Maximum number of concurrent OpenCDP requests.
     * Default: 10. Hard-capped internally at 30.
     */
    maxConcurrentRequests?: number; // Maximum concurrent requests to the CDP
    /**
     * Request timeout in milliseconds.
     * Default: 10000 (10 seconds).
     */
    timeout?: number; // Request timeout in milliseconds
    /**
     * Customer.io config for dual-write
     */
    customerIo?: {
        siteId: string;
        apiKey: string;
        region?: 'us' | 'eu';
    };

    // General config
    /**
     * Optional: If true, sends events to both OpenCDP and Customer.io.
     * This is useful for dual-write scenarios.
     */
    sendToCustomerIo?: boolean; // If true, sends to both OpenCDP and Customer.io

    /*
    * Optional: Enable debug mode for additional logging.
    * This can help with troubleshooting and understanding internal operations.
    * Note: This should not be used in production environments as it increase memory usage and log verbosity.
    */
    debug?: boolean;     // Enable debug logging
    /**
     * Optional: Opt-in to throwing errors from the SDK.
     * Default: false. When false, the SDK logs errors and resolves without throwing.
     * When true, validation and request failures will throw so callers can catch them.
     */
    failOnException?: boolean;
}

export interface Logger {
    debug(message: string): void;
    error(message: string, context?: Record<string, any>): void;
    warn(message: string): void;
}


export type Identifiers = {
    id: string | number;
} | {
    email: string;
};

export type SendEmailRequestRequiredOptions = {
    to: string;
    identifiers: Identifiers;
};

export type SendEmailRequestOptionalOptions = Partial<{
    message_data: Record<string, any>;
    headers: Record<string, any>;
    preheader: string;
    reply_to: string;
    bcc: string[];
    cc: string[];
    plaintext_body: string;
    amp_body: string;
    fake_bcc: boolean;
    disable_message_retention: boolean;
    send_to_unsubscribed: boolean;
    tracked: boolean;
    queue_draft: boolean;
    send_at: number;
    disable_css_preprocessing: boolean;
    language: string;
    // ⚠️  BACKEND NOT YET SUPPORTED - These fields are accepted but not processed by the backend
    attachments: Record<string, string>;
}>;

export type SendEmailRequestWithTemplate = SendEmailRequestRequiredOptions & SendEmailRequestOptionalOptions & {
    transactional_message_id: string | number;
};

export type SendEmailRequestWithoutTemplate = SendEmailRequestRequiredOptions & SendEmailRequestOptionalOptions & {
    body: string;
    subject: string;
    from: string;
};

export type SendEmailRequestOptions = SendEmailRequestWithTemplate | SendEmailRequestWithoutTemplate;

export type Message = Partial<SendEmailRequestWithTemplate & SendEmailRequestWithoutTemplate> & {
    attachments?: Record<string, string>;
};

export class SendEmailRequest {
    message: Message;
    
    constructor(opts: SendEmailRequestOptions) {
        this.message = {
            to: opts.to,
            identifiers: opts.identifiers,
            message_data: opts.message_data,
            send_at: opts.send_at,
            disable_message_retention: opts.disable_message_retention,
            send_to_unsubscribed: opts.send_to_unsubscribed,
            queue_draft: opts.queue_draft,
            bcc: opts.bcc,
            cc: opts.cc,
            fake_bcc: opts.fake_bcc,
            reply_to: opts.reply_to,
            preheader: opts.preheader,
            headers: opts.headers,
            disable_css_preprocessing: opts.disable_css_preprocessing,
            tracked: opts.tracked,
            language: opts.language,
            attachments: opts.attachments,
            // Template-based fields
            transactional_message_id: 'transactional_message_id' in opts ? opts.transactional_message_id : undefined,
            body: 'body' in opts ? opts.body : undefined,
            amp_body: opts.amp_body,
            plaintext_body: opts.plaintext_body,
            subject: 'subject' in opts ? opts.subject : undefined,
            from: 'from' in opts ? opts.from : undefined
        };
    }
    
    attach(name: string, data: any, options?: {
        encode?: boolean | undefined;
    }): void {
        if (!this.message.attachments) {
            this.message.attachments = {};
        }
        this.message.attachments[name] = data;
    }
}

export interface SendPushRequest {
    // Required fields
    identifiers: {
        id?: string;
        email?: string;
        cdp_id?: string;
    };
    transactional_message_id: string | number;
    
    // Optional fields
    title?: string;
    body?: string;
    message_data?: Record<string, any>;
}

export interface SendSmsRequest {
    // Required fields
    identifiers: {
        id?: string;
        email?: string;
        cdp_id?: string;
    };
    
    // Optional fields
    transactional_message_id?: string | number;
    to?: string; // Phone number
    from?: string; // Sender phone number
    body?: string; // SMS message content (required if no transactional_message_id)
    message_data?: Record<string, any>;
}