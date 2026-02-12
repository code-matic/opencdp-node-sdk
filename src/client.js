"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDPClient = void 0;
var axios_1 = require("axios");
var customerio_node_1 = require("customerio-node");
/**
 * Validates that the identifier is not empty
 */
function validateIdentifier(identifier) {
    if (!identifier || identifier.toString().trim() === '') {
        throw new Error('Identifier cannot be empty');
    }
}
/**
 * Validates that the event name is not empty
 */
function validateEventName(eventName) {
    if (!eventName || eventName.trim() === '') {
        throw new Error('Event name cannot be empty');
    }
}
var CDPClient = /** @class */ (function () {
    function CDPClient(config) {
        this.config = config;
        this.customerIoClient = null;
        this.apiRoot = config.cdpEndpoint || 'https://cdp-data-gateway-749119130796.europe-west1.run.app/date-gateway';
        this.sendToCustomerIo = Boolean(config.sendToCustomerIo && config.customerIo);
        if (config.cdpLogger) {
            this.logger = config.cdpLogger;
        }
        else {
            this.logger = console;
        }
        if (this.sendToCustomerIo && config.customerIo) {
            var region = config.customerIo.region === 'eu' ? customerio_node_1.RegionEU : customerio_node_1.RegionUS;
            this.customerIoClient = new customerio_node_1.TrackClient(config.customerIo.siteId, config.customerIo.apiKey, { region: region });
        }
    }
    /**
     * Identify a person in the CDP
     * @param identifier The person identifier
     * @param properties Additional properties for the person
     * @throws Error if the identifier is empty
     */
    CDPClient.prototype.identify = function (identifier, properties) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedProps, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validateIdentifier(identifier);
                        normalizedProps = properties || {};
                        if (!(this.sendToCustomerIo && this.customerIoClient)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.customerIoClient.identify(identifier, normalizedProps)];
                    case 1:
                        _a.sent();
                        if (this.config.debug) {
                            this.logger.debug("[Customer.io] Identified ".concat(identifier));
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, axios_1.default.post("".concat(this.apiRoot, "/v1/persons/identify"), {
                                identifier: identifier,
                                properties: normalizedProps
                            }, {
                                headers: {
                                    'Authorization': this.config.cdpApiKey,
                                    'Content-Type': 'application/json'
                                }
                            })];
                    case 3:
                        _a.sent();
                        if (this.config.debug) {
                            this.logger.debug("[CDP] Identified ".concat(identifier));
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        if (this.config.debug) {
                            this.logger.error('[CDP] Identify error:', { error: error_1 });
                        }
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Track an event for a person.
     * @param identifier The person identifier
     * @param eventName The event name
     * @param properties Additional properties for the event
     * @throws Error if the identifier or event name is empty
     */
    CDPClient.prototype.track = function (identifier, eventName, properties) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedProps, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validateIdentifier(identifier);
                        validateEventName(eventName);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        normalizedProps = properties || {};
                        if (!(this.sendToCustomerIo && this.customerIoClient)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.customerIoClient.track(identifier, { name: eventName, data: normalizedProps })];
                    case 2:
                        _a.sent();
                        if (this.config.debug) {
                            this.logger.debug("[Customer.io] Tracked event ".concat(eventName, " for ").concat(identifier));
                        }
                        _a.label = 3;
                    case 3: return [4 /*yield*/, axios_1.default.post("".concat(this.apiRoot, "/v1/persons/track"), {
                            identifier: identifier,
                            event_name: eventName,
                            properties: normalizedProps
                        }, {
                            headers: {
                                'Authorization': this.config.cdpApiKey,
                                'Content-Type': 'application/json'
                            }
                        })];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_2 = _a.sent();
                        if (this.config.debug) {
                            this.logger.error('[CDP] Track error:', { error: error_2 });
                        }
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update properties for a person. This will overwrite any existing properties.
     * @param identifier The person identifier
     * @param properties The properties to update
     * @returns
     * @throws Error if the identifier is empty
     */
    CDPClient.prototype.update = function (identifier, properties) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validateIdentifier(identifier);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        if (!(this.sendToCustomerIo && this.customerIoClient)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.customerIoClient.identify(identifier, properties)];
                    case 2:
                        _a.sent();
                        if (this.config.debug) {
                            this.logger.debug("[Customer.io] Updated properties for ".concat(identifier));
                        }
                        _a.label = 3;
                    case 3: return [4 /*yield*/, axios_1.default.post("".concat(this.apiRoot, "/v1/persons/update"), {
                            identifier: identifier,
                            properties: properties
                        }, {
                            headers: {
                                'Authorization': this.config.cdpApiKey,
                                'Content-Type': 'application/json'
                            }
                        })];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_3 = _a.sent();
                        if (this.config.debug) {
                            this.logger.error('[CDP] Update error:', { error: error_3 });
                        }
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return CDPClient;
}());
exports.CDPClient = CDPClient;
