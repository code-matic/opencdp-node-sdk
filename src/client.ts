import axios, { AxiosInstance } from "axios";
import pLimit from "p-limit";
import { TrackClient, RegionUS, RegionEU } from "customerio-node";
import { CDPConfig, Logger, SendEmailRequest, SendPushRequest, SendSmsRequest } from "./types";

/**
 * Validates that the identifier is not empty
 */
function validateIdentifier(identifier: string | number): void {
  if (
    identifier === null ||
    identifier === undefined ||
    identifier === "" ||
    (typeof identifier === "string" && identifier.trim() === "")
  ) {
    throw new Error("Identifier cannot be empty");
  }
}

/**
 * Validates that the event name is not empty
 */
function validateEventName(eventName: string): void {
  if (!eventName || eventName.trim() === "") {
    throw new Error("Event name cannot be empty");
  }
}

/**
 * Validates that properties is a valid object
 */
function validateProperties(
  properties: Record<string, any> | undefined
): Record<string, any> {
  if (properties === null || properties === undefined) {
    return {};
  }
  // if (typeof properties !== 'object' || Array.isArray(properties)) {
  //     throw new Error('Properties must be a valid object');
  // }
  return properties;
}

/**
 * Validates that the email address is not empty
 */
function validateEmail(email: string): void {
  if (!email || email.trim() === "") {
    throw new Error("Email address cannot be empty");
  }
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email address format");
  }
}

/**
 * Validates that the send email request has required fields
 */
function validateSendEmailRequest(request: SendEmailRequest): void {
  const message = request.message;

  // Validate required fields
  if (!message.to) {
    throw new Error("to is required");
  }
  validateEmail(message.to);

  // Validate identifiers - must contain exactly one of: id or email
  if (!message.identifiers) {
    throw new Error("identifiers is required");
  }

  const hasId =
    "id" in message.identifiers &&
    message.identifiers.id !== undefined &&
    message.identifiers.id !== null &&
    message.identifiers.id !== "";
  const hasEmail =
    "email" in message.identifiers &&
    message.identifiers.email !== undefined &&
    message.identifiers.email !== null &&
    message.identifiers.email !== "";

  if (!hasId && !hasEmail) {
    throw new Error(
      "identifiers must contain exactly one of: id, email, or cdp_id"
    );
  }

  if (hasId && hasEmail) {
    throw new Error(
      "identifiers must contain exactly one of: id, email, or cdp_id"
    );
  }

  // Validate email fields
  if ("from" in message && message.from) {
    validateEmail(message.from);
  }

  if (message.bcc && message.bcc.length > 0) {
    message.bcc.forEach(email => validateEmail(email));
  }

  if (message.cc && message.cc.length > 0) {
    message.cc.forEach(email => validateEmail(email));
  }

  if (message.reply_to) {
    validateEmail(message.reply_to);
  }

  // Validate send_at if provided
  if (message.send_at !== undefined) {
    if (!Number.isInteger(message.send_at) || message.send_at < 0) {
      throw new Error("send_at must be a positive integer");
    }
  }

  // Validate body fields
  if (
    "body" in message &&
    message.body !== undefined &&
    message.body !== null &&
    message.body.trim() === ""
  ) {
    throw new Error("body cannot be empty if provided");
  }

  if (
    message.amp_body !== undefined &&
    message.amp_body !== null &&
    message.amp_body.trim() === ""
  ) {
    throw new Error("amp_body cannot be empty if provided");
  }

  if (
    message.plaintext_body !== undefined &&
    message.plaintext_body !== null &&
    message.plaintext_body.trim() === ""
  ) {
    throw new Error("plaintext_body cannot be empty if provided");
  }

  // Validate headers if provided
  if (message.headers !== undefined) {
    if (typeof message.headers !== "object" || Array.isArray(message.headers)) {
      throw new Error("headers must be an object");
    }
  }

  // Type guard to check if it's a template-based request
  const isTemplateRequest = message.transactional_message_id !== undefined;

  if (!isTemplateRequest) {
    // Raw email - body, subject, and from are required
    const errors = [];

    if (!("body" in message) || !message.body) {
      errors.push("body is required when not using a template");
    }
    if (!("subject" in message) || !message.subject) {
      errors.push("subject is required when not using a template");
    }
    if (!("from" in message) || !message.from) {
      errors.push("from is required when not using a template");
    }

    if (errors.length > 0) {
      throw new Error(`When not using a template: ${errors.join(", ")}`);
    }
  }
}

/**
 * Validates that the send push request has required fields
 */
function validateSendPushRequest(request: SendPushRequest): void {
  // Validate required fields
  if (!request.identifiers) {
    throw new Error("identifiers is required");
  }

  const hasId =
    "id" in request.identifiers &&
    request.identifiers.id !== undefined &&
    request.identifiers.id !== null &&
    request.identifiers.id !== "";
  const hasEmail =
    "email" in request.identifiers &&
    request.identifiers.email !== undefined &&
    request.identifiers.email !== null &&
    request.identifiers.email !== "";
  const hasCdpId =
    "cdp_id" in request.identifiers &&
    request.identifiers.cdp_id !== undefined &&
    request.identifiers.cdp_id !== null &&
    request.identifiers.cdp_id !== "";

  if (!hasId && !hasEmail && !hasCdpId) {
    throw new Error(
      "identifiers must contain exactly one of: id, email, or cdp_id"
    );
  }

  if ((hasId ? 1 : 0) + (hasEmail ? 1 : 0) + (hasCdpId ? 1 : 0) > 1) {
    throw new Error(
      "identifiers must contain exactly one of: id, email, or cdp_id"
    );
  }

  if (!request.transactional_message_id) {
    throw new Error("transactional_message_id is required");
  }

  // Validate body field
  if (
    request.body !== undefined &&
    request.body !== null &&
    request.body.trim() === ""
  ) {
    throw new Error("body cannot be empty if provided");
  }
}

/**
 * Validates phone number format (E.164 format)
 */
function validatePhoneNumber(phone: string): void {
  if (!phone || phone.trim() === "") {
    throw new Error("Phone number cannot be empty");
  }
  // E.164 format: ^\+?[1-9]\d{1,14}$
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone)) {
    throw new Error("Phone number must be in international format (e.g., +1234567890)");
  }
}

/**
 * Validates that the send SMS request has required fields
 */
function validateSendSmsRequest(request: SendSmsRequest): void {
  // Validate required fields
  if (!request.identifiers) {
    throw new Error("identifiers is required");
  }

  const hasId =
    "id" in request.identifiers &&
    request.identifiers.id !== undefined &&
    request.identifiers.id !== null &&
    request.identifiers.id !== "";
  const hasEmail =
    "email" in request.identifiers &&
    request.identifiers.email !== undefined &&
    request.identifiers.email !== null &&
    request.identifiers.email !== "";
  const hasCdpId =
    "cdp_id" in request.identifiers &&
    request.identifiers.cdp_id !== undefined &&
    request.identifiers.cdp_id !== null &&
    request.identifiers.cdp_id !== "";

  if (!hasId && !hasEmail && !hasCdpId) {
    throw new Error(
      "identifiers must contain exactly one of: id, email, or cdp_id"
    );
  }

  if ((hasId ? 1 : 0) + (hasEmail ? 1 : 0) + (hasCdpId ? 1 : 0) > 1) {
    throw new Error(
      "identifiers must contain exactly one of: id, email, or cdp_id"
    );
  }

  // Validate conditional requirement: body is required if no transactional_message_id
  const hasTemplateId = request.transactional_message_id !== undefined && 
                        request.transactional_message_id !== null &&
                        request.transactional_message_id !== "";

  if (!hasTemplateId && !request.body) {
    throw new Error("body is required when not using a template");
  }

  // Validate phone number format if to is provided
  if (request.to) {
    validatePhoneNumber(request.to);
  }

  // Validate from phone number format if provided
  if (request.from) {
    validatePhoneNumber(request.from);
  }

  // Validate body field
  if (
    request.body !== undefined &&
    request.body !== null &&
    request.body.trim() === ""
  ) {
    throw new Error("body cannot be empty if provided");
  }

  // Validate message_data is an object if provided
  if (request.message_data !== undefined) {
    if (
      request.message_data === null ||
      typeof request.message_data !== "object" ||
      Array.isArray(request.message_data)
    ) {
      throw new Error("message_data must be an object");
    }
  }
}

interface DeviceRegistrationParameters {
  deviceId: string;
  name?: string;
  platform: "android" | "ios" | "web";
  osVersion?: string;
  model?: string;
  fcmToken: string;
  apnToken?: string;
  appVersion?: string;
  last_active_at?: string;
  attributes?: Record<string, any>;
}

const DEFAULT_CONCURRENCY = 10;
const MAX_SAFE_CONCURRENCY = 30;
export class CDPClient {
  private readonly customerIoClient: TrackClient | null = null;
  private readonly apiRoot: string;
  private readonly sendToCustomerIo: boolean;
  private readonly logger: Logger;
  private limit: ReturnType<typeof pLimit>;
  private timeout: number;
  private readonly axiosInstance: AxiosInstance;

  constructor(private config: CDPConfig) {
    this.apiRoot =
      config.cdpEndpoint || "https://api.opencdp.io/gateway/data-gateway";
    this.sendToCustomerIo = Boolean(
      config.sendToCustomerIo && config.customerIo
    );
    this.timeout = config.timeout || 10000;

    // Create axios instance with connection pooling and reuse
    this.axiosInstance = axios.create({
      baseURL: this.apiRoot,
      timeout: this.timeout,
      headers: {
        Authorization: this.config.cdpApiKey,
        "Content-Type": "application/json",
      },
      // Enable connection pooling and reuse
      httpAgent: new (require("http").Agent)({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 50,
        maxFreeSockets: 10,
        timeout: 60000,
        freeSocketTimeout: 30000,
      }),
      httpsAgent: new (require("https").Agent)({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 50,
        maxFreeSockets: 10,
        timeout: 60000,
        freeSocketTimeout: 30000,
      }),
    });

    let requestedConcurrency =
      config.maxConcurrentRequests || DEFAULT_CONCURRENCY;
    if (requestedConcurrency < 1) {
      requestedConcurrency = DEFAULT_CONCURRENCY;
    }
    const concurrencyLimit = Math.min(
      requestedConcurrency,
      MAX_SAFE_CONCURRENCY
    );

    if (config.cdpLogger) {
      this.logger = config.cdpLogger;
    } else {
      this.logger = {
        debug: console.debug.bind(console),
        error: console.error.bind(console),
        warn: console.warn.bind(console),
      };
    }

    if (requestedConcurrency > MAX_SAFE_CONCURRENCY && this.config.debug) {
      this.logger.debug(
        `[CDP] maxConcurrentRequests (${requestedConcurrency}) exceeds limit. Using capped value: ${concurrencyLimit}`
      );
    }

    // Initialize the concurrency limiter
    this.limit = pLimit(concurrencyLimit);

    if (this.sendToCustomerIo && config.customerIo) {
      const region = config.customerIo.region === "eu" ? RegionEU : RegionUS;
      try {
        this.customerIoClient = new TrackClient(
          config.customerIo.siteId,
          config.customerIo.apiKey,
          { region }
        );
      } catch (error) {
        if (this.config.debug) {
          this.logger.error("[Customer.io] Initialize error", { error });
        }
      }
    }
  }

  /**
   * Tests the connection to the OpenCDP API server.
   * Sends a ping request to verify that the configured endpoint is reachable and valid.
   *
   * This method ensures that credentials, and network access are configured correctly.
   * It does NOT establish a persistent connection.
   *
   * Do not ping before sending each request
   * @throws Error only when config.failOnException === true and the connection fails due to invalid credentials, network issues, or timeouts.
   */
  async ping(): Promise<void> {
    await this.validateConnection();
  }

  async validateConnection(): Promise<void> {
    try {
      const response = await this.axiosInstance.get("/v1/health/ping");

      if (this.config.debug) {
        this.logger.debug(
          `[CDP] Connection Established! Status: ${response.status}`
        );
      }
    } catch (error: any) {
      // Extract details for better debugging
      const statusCode = error.response?.status;
      const statusText = error.response?.statusText;
      const responseData = error.response?.data;
      const dnsError = error.code === "ENOTFOUND";
      const timeoutError = error.code === "ECONNABORTED";

      // Error summary
      const errorSummary = {
        message: error.message,
        ...(statusCode && { statusCode }),
        ...(statusText && { statusText }),
        ...(dnsError && { dnsError: true }),
        ...(timeoutError && { timeout: true }),
        ...(responseData && { responseData }),
        stack: this.config.debug ? error.stack : undefined,
      };
      if (this.config.debug) {
        this.logger.error("[CDP] Failed to connect to CDP Server", errorSummary);
      }
      if (this.config.failOnException) {
        throw error;
      } else {
        return;
      }
    }
  }

  private async limited<T>(fn: () => Promise<T>): Promise<T> {
    return this.limit(fn);
  }

  /**
   * Identify a person in the CDP
   * This method is concurrency-limited using p-limit to avoid overwhelming traffic external traffic.
   * @param identifier The person identifier
   * @param properties Additional properties for the person
   * @throws Error only when config.failOnException === true (e.g., when the identifier is empty or the request fails)
   */
  async identify(
    identifier: string,
    properties?: Record<string, any>
  ): Promise<void> {
    return this.limited(async () => {
      try {
        validateIdentifier(identifier);
      } catch (error) {
        if (this.config.debug) {
          this.logger.error("[CDP] Identify validation error", { error });
        }
        if (this.config.failOnException) {
          throw error;
        }
        return;
      }
      const normalizedProps = validateProperties(properties);

      if (this.sendToCustomerIo && this.customerIoClient) {
        try {
          await this.customerIoClient.identify(identifier, normalizedProps);
          if (this.config.debug) {
            this.logger.debug(`[Customer.io] Identified ${identifier}`);
          }
        } catch (error) {
          if (this.config.debug) {
            this.logger.error("[Customer.io] Identify error", { error });
          }
          if (this.config.failOnException) {
            throw error;
          }
        }
      }

      try {
        await this.axiosInstance.post("/v1/persons/identify", {
          identifier,
          properties: normalizedProps,
        });

        if (this.config.debug) {
          this.logger.debug(`[CDP] Identified ${identifier}`);
        }
      } catch (error) {
        // NB: Avoid logging large error objects directly to reduce memory footprint on high traffic apps
        if (this.config.debug) {
          const errorSummary = {
            message: error?.message,
            status: error?.response?.status,
            data: error?.response?.data?.message || "[truncated]",
          };
          this.logger.error("[CDP] Identify error", { errorSummary });
        }
        // Re-throw the error so users can handle failures
        if (this.config.failOnException) {
          throw error;
        }
        return;
      }
    });
  }

  /**
   * Track an event for a person.
   * @param identifier The person identifier
   * @param eventName The event name
   * @param properties Additional properties for the event
   * @throws Error only when config.failOnException === true (e.g., when validation or request fails)
   */
  async track(
    identifier: string,
    eventName: string,
    properties?: Record<string, any>
  ): Promise<void> {
    return this.limited(async () => {
      try {
        validateIdentifier(identifier);
        validateEventName(eventName);
      } catch (error) {
        if (this.config.debug) {
          this.logger.error("[CDP] Track validation error", { error });
        }
        if (this.config.failOnException) {
          throw error;
        }
        return;
      }
      try {
        const normalizedProps = validateProperties(properties);
        if (this.sendToCustomerIo && this.customerIoClient) {
          try {
            await this.customerIoClient.track(identifier, {
              name: eventName,
              data: normalizedProps,
            });
            if (this.config.debug) {
              this.logger.debug(
                `[Customer.io] Tracked event ${eventName} for ${identifier}`
              );
            }
          } catch (error) {
            if (this.config.debug) {
              this.logger.error("[Customer.io] Track error", { error });
            }
            if (this.config.failOnException) {
              throw error;
            }
          }
        }

        await this.axiosInstance.post("/v1/persons/track", {
          identifier,
          eventName: eventName,
          properties: normalizedProps,
        });

        if (this.config.debug) {
          this.logger.debug(
            `[CDP] Tracked event ${eventName} for ${identifier}`
          );
        }
      } catch (error) {
        if (this.config.debug) {
          const errorSummary = {
            message: error?.message,
            status: error?.response?.status,
            data: error?.response?.data?.message || "[truncated]",
          };
          this.logger.error("[CDP] Track error:", { errorSummary });
        }
        if (this.config.failOnException) {
          throw error;
        }
        return;
      }
    });
  }

  /**
   * Register a device for a person. A device must be registered to send push notifications
   * @param identifier
   * @param deviceRegistrationParameters
   * @throws Error only when config.failOnException === true (e.g., when validation or request fails)
   */
  async registerDevice(
    identifier: string,
    deviceRegistrationParameters: DeviceRegistrationParameters
  ): Promise<void> {
    return this.limited(async () => {
      try {
        validateIdentifier(identifier);
      } catch (error) {
        if (this.config.debug) {
          this.logger.error("[CDP] Register device validation error", {
            error,
          });
        }
        if (this.config.failOnException) {
          throw error;
        }
        return;
      }

      if (this.sendToCustomerIo && this.customerIoClient) {
        try {
          await this.customerIoClient.addDevice(
            identifier,
            deviceRegistrationParameters.deviceId,
            deviceRegistrationParameters.platform,
            deviceRegistrationParameters
          );
        } catch (error) {
          if (this.config.debug) {
            this.logger.error("[Customer.io] Register device error", { error });
          }
          if (this.config.failOnException) {
            throw error;
          }
        }
      }

      try {
        await this.axiosInstance.post("/v1/persons/registerDevice", {
          identifier,
          ...deviceRegistrationParameters,
        });
      } catch (error) {
        if (this.config.debug) {
          // NB: Avoid logging large error objects directly to reduce memory footprint on high traffic apps
          const errorSummary = {
            message: error?.message,
            status: error?.response?.status,
            data: error?.response?.data?.message || "[truncated]",
          };
          this.logger.error("[CDP] Register device error:", { errorSummary });
        }
        if (this.config.failOnException) {
          throw error;
        }
      }
    });
  }

  /**
   * Send an email using the CDP transactional email service
   * @param request The send email request parameters
   * @returns Promise that resolves when the email is sent
  * @throws Error only when config.failOnException === true and validation or the request fails
   */
  async sendEmail(request: SendEmailRequest): Promise<Record<string, any>> {
    return this.limited(async () => {
      try {
        validateSendEmailRequest(request);
      } catch (error) {
        if (this.config.debug) {
          this.logger.error("[CDP] Send email validation error", { error });
        }
        if (this.config.failOnException) {
          throw error;
        }
        return;
      }

      // Check for unsupported fields and log warnings
      this.warnUnsupportedFields(request);

      // Build the request payload - pass through all fields as they match the schema
      const message = request.message;
      const emailPayload = {
        to: message.to,
        identifiers: message.identifiers,
        message_data: message.message_data,
        send_at: message.send_at,
        disable_message_retention: message.disable_message_retention,
        send_to_unsubscribed: message.send_to_unsubscribed,
        queue_draft: message.queue_draft,
        bcc: message.bcc,
        cc: message.cc,
        fake_bcc: message.fake_bcc,
        reply_to: message.reply_to,
        preheader: message.preheader,
        headers: message.headers,
        disable_css_preprocessing: message.disable_css_preprocessing,
        tracked: message.tracked,
        transactional_message_id:
          "transactional_message_id" in message
            ? message.transactional_message_id
            : undefined,
        body: "body" in message ? message.body : undefined,
        body_amp: message.amp_body,
        body_plain: message.plaintext_body,
        subject: "subject" in message ? message.subject : undefined,
        from: "from" in message ? message.from : undefined,
        language: message.language,
      };

      // Remove undefined values to keep the payload clean
      const cleanPayload = Object.fromEntries(
        Object.entries(emailPayload).filter(([_, value]) => value !== undefined)
      );
      if (this.sendToCustomerIo && this.customerIoClient && this.config.debug) {
        // Warning that to avoid sending twice it will not be sent to CIO. to turn this off set sendToCustomerIo to false.
        this.logger.warn(
          "[CDP] Warning: Transactional messaging email will NOT be sent to Customer.io to avoid sending twice. To turn this warning off set `sendToCustomerIo` to false."
        );
      }

      try {
        const response = await this.axiosInstance.post(
          "/v1/send/email",
          cleanPayload
        );

        if (this.config.debug) {
          this.logger.debug(`[CDP] Email sent successfully to ${message.to}`);
        }

        return response.data;
      } catch (error) {
        const errorSummary = {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data?.message || "[truncated]",
        };
        if (this.config.debug) {
          this.logger.error("[CDP] Send email error:", { errorSummary });
        }

        // Clean up the error to remove technical details while preserving helpful information
        const cleanError = error;

        // Set consistent error properties
        if (errorSummary.data) {
          cleanError.message = errorSummary.data;
        } else if (errorSummary.message) {
          cleanError.message = errorSummary.message;
        }
        cleanError.name = "CDPEmailError";
        cleanError.code = "EMAIL_SEND_FAILED";
        cleanError.summary = errorSummary;
        cleanError.status = error?.response?.status || 400;

        // Remove technical details that clutter the error
        delete cleanError.config;
        delete cleanError.request;
        // delete cleanError.response;
        delete cleanError.stack;

        if (this.config.failOnException) {
          throw cleanError;
        }
        return { ok: false, error: cleanError };
      }
    });
  }

  /**
   * Warns about unsupported fields that are accepted but not processed by the backend
   * @param request The send email request parameters
   */
  private warnUnsupportedFields(request: SendEmailRequest): void {
    const message = request.message;
    const unsupportedFields = [];

    if (message.send_at !== undefined) {
      unsupportedFields.push("send_at");
    }
    if (message.disable_message_retention !== undefined) {
      unsupportedFields.push("disable_message_retention");
    }
    if (message.send_to_unsubscribed !== undefined) {
      unsupportedFields.push("send_to_unsubscribed");
    }
    if (message.queue_draft !== undefined) {
      unsupportedFields.push("queue_draft");
    }
    if (message.headers !== undefined) {
      unsupportedFields.push("headers");
    }
    if (message.disable_css_preprocessing !== undefined) {
      unsupportedFields.push("disable_css_preprocessing");
    }
    if (message.tracked !== undefined) {
      unsupportedFields.push("tracked");
    }

    if (message.fake_bcc !== undefined) {
      unsupportedFields.push("fake_bcc");
    }
    if (message.reply_to !== undefined) {
      unsupportedFields.push("reply_to");
    }
    if (message.preheader !== undefined) {
      unsupportedFields.push("preheader");
    }
    if (message.attachments !== undefined) {
      unsupportedFields.push("attachments");
    }

    if (unsupportedFields.length > 0 && this.config.debug) {
      this.logger.warn(
        `[CDP] Warning: The following fields are not yet supported by the backend and will be ignored: ${unsupportedFields.join(
          ", "
        )}. ` +
          "These fields are included for future compatibility but have no effect on email delivery."
      );
    }
  }

  /**
   * Send a push notification using the OpenCDP transactional push service
   * @param request The send push request parameters
   * @returns Promise that resolves when the push notification is sent
   * @throws Error only when config.failOnException === true and validation or the request fails
   */
  async sendPush(request: SendPushRequest): Promise<any> {
    return this.limited(async () => {
      try {
        validateSendPushRequest(request);
      } catch (error) {
        if (this.config.debug) {
          this.logger.error("[CDP] Send push validation error", { error });
        }
        if (this.config.failOnException) {
          throw error;
        }
        return;
      }

      // Build the request payload - pass through all fields as they match the schema
      const pushPayload = {
        identifiers: request.identifiers,
        transactional_message_id: request.transactional_message_id,
        title: request.title,
        body: request.body,
        message_data: request.message_data,
      };

      // Remove undefined values to keep the payload clean
      const cleanPayload = Object.fromEntries(
        Object.entries(pushPayload).filter(([_, value]) => value !== undefined)
      );
      if (this.sendToCustomerIo && this.customerIoClient && this.config.debug) {
        // Warning that to avoid sending twice it will not be sent to CIO. to turn this off set sendToCustomerIo to false.
        this.logger.warn(
          "[CDP] Warning: Transactional messaging push will NOT be sent to Customer.io to avoid sending twice. To turn this warning off set `sendToCustomerIo` to false."
        );
      }

      try {
        const response = await this.axiosInstance.post(
          "/v1/send/push",
          cleanPayload
        );

        if (this.config.debug) {
          this.logger.debug(`[CDP] Push notification sent successfully`);
        }

        return response.data;
      } catch (error) {
        const errorSummary = {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data?.message || "[truncated]",
        };
        if (this.config.debug) {
          this.logger.error("[CDP] Send push error:", { errorSummary });
        }

        // Clean up the error to remove technical details while preserving helpful information
        const cleanError = error;
        if (errorSummary.data) {
          cleanError.message = errorSummary.data;
        } else if (errorSummary.message) {
          cleanError.message = errorSummary.message;
        }

        // Set consistent error properties
        cleanError.name = "CDPPushError";
        cleanError.code = "PUSH_SEND_FAILED";
        cleanError.summary = errorSummary;
        cleanError.status = error?.response?.status || 400;

        // Remove technical details that clutter the error
        delete cleanError.config;
        delete cleanError.request;
        delete cleanError.response;
        delete cleanError.stack;

        if (this.config.failOnException) {
          throw cleanError;
        }
        return;
      }
    });
  }

  /**
   * Send an SMS using the OpenCDP transactional SMS service
   * @param request The send SMS request parameters
   * @returns Promise that resolves when the SMS is sent
   * @throws Error only when config.failOnException === true and validation or the request fails
   */
  async sendSms(request: SendSmsRequest): Promise<any> {
    return this.limited(async () => {
      try {
        validateSendSmsRequest(request);
      } catch (error) {
        if (this.config.debug) {
          this.logger.error("[CDP] Send SMS validation error", { error });
        }
        if (this.config.failOnException) {
          throw error;
        }
        return;
      }

      // Build the request payload - pass through all fields as they match the schema
      // Convert transactional_message_id to string if it's a number (backend expects string)
      const transactionalMessageId =
        request.transactional_message_id !== undefined &&
        request.transactional_message_id !== null &&
        request.transactional_message_id !== ""
          ? String(request.transactional_message_id)
          : undefined;

      const smsPayload = {
        identifiers: request.identifiers,
        transactional_message_id: transactionalMessageId,
        to: request.to,
        from: request.from,
        body: request.body,
        message_data: request.message_data,
      };

      // Remove undefined values to keep the payload clean
      const cleanPayload = Object.fromEntries(
        Object.entries(smsPayload).filter(([_, value]) => value !== undefined)
      );
      if (this.sendToCustomerIo && this.customerIoClient && this.config.debug) {
        // Warning that to avoid sending twice it will not be sent to CIO. to turn this off set sendToCustomerIo to false.
        this.logger.warn(
          "[CDP] Warning: Transactional messaging SMS will NOT be sent to Customer.io to avoid sending twice. To turn this warning off set `sendToCustomerIo` to false."
        );
      }

      try {
        const response = await this.axiosInstance.post(
          "/v1/send/sms",
          cleanPayload
        );

        if (this.config.debug) {
          this.logger.debug(`[CDP] SMS sent successfully`);
        }

        return response.data;
      } catch (error) {
        const errorSummary = {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data?.message || "[truncated]",
        };
        if (this.config.debug) {
          this.logger.error("[CDP] Send SMS error:", { errorSummary });
        }

        // Clean up the error to remove technical details while preserving helpful information
        const cleanError = error;
        if (errorSummary.data) {
          cleanError.message = errorSummary.data;
        } else if (errorSummary.message) {
          cleanError.message = errorSummary.message;
        }

        // Set consistent error properties
        cleanError.name = "CDPSmsError";
        cleanError.code = "SMS_SEND_FAILED";
        cleanError.summary = errorSummary;
        cleanError.status = error?.response?.status || 400;

        // Remove technical details that clutter the error
        delete cleanError.config;
        delete cleanError.request;
        delete cleanError.response;
        delete cleanError.stack;

        if (this.config.failOnException) {
          throw cleanError;
        }
        return;
      }
    });
  }
}
