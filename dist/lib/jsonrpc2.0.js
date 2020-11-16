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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
exports.JsonRpc2 = exports.ERROR_CODEs = void 0;
var uuid_1 = require("uuid");
exports.ERROR_CODEs = {
    ParseError: { code: -32700, msg: "语法解析错误" },
    InvalidRequest: { code: -32600, msg: "无效请求" },
    MethodNotFound: { code: -32601, msg: "找不到方法" },
    InvalidParams: { code: -32602, msg: "无效的参数" },
    InternalError: { code: -32603, msg: "内部错误" },
    Timeout: { code: -32000, msg: "超时，没有收到可辨认的回复" }
};
var JsonRpc2 = (function () {
    function JsonRpc2(options) {
        this.version = "2.0";
        this.registerRpcCallMap = new Map();
        this.waitForResult = new Map();
        var send = options.send, timeout = options.timeout;
        this.timeout = timeout || 60;
        this.send = function (msg) {
            send(typeof msg === "string" ? msg : JSON.stringify(msg));
        };
    }
    JsonRpc2.prototype.registerRpcCall = function (methodName, method, paramsKeys) {
        this.registerRpcCallMap.set(methodName, { method: method, paramsKeys: paramsKeys });
    };
    JsonRpc2.prototype.registerRpcNotifyCall = function (methodName, method, paramsKeys) {
        this.registerRpcCallMap.set(methodName, {
            method: method,
            paramsKeys: paramsKeys,
            type: "notify"
        });
    };
    JsonRpc2.prototype.unregisterRpcCall = function (methodName) {
        this.registerRpcCallMap["delete"](methodName);
    };
    JsonRpc2.prototype.receive = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var receiveData, id, content, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        try {
                            receiveData = typeof data === "string" ? JSON.parse(data) : data;
                        }
                        catch (error) {
                            console.log("不理解的消息:", error.message);
                            return [2, this.send({
                                    jsonrpc: this.version,
                                    error: exports.ERROR_CODEs.ParseError,
                                    id: null
                                })];
                        }
                        id = receiveData.id;
                        if (receiveData.jsonrpc === this.version &&
                            (receiveData.result || receiveData.error) &&
                            id != null &&
                            id !== undefined &&
                            this.waitForResult.has(id)) {
                            return [2, this.handleResponse(receiveData)];
                        }
                        if (!Array.isArray(receiveData)) return [3, 2];
                        return [4, Promise.all(receiveData.map(function (r) { return _this.handleRequest(r); }))];
                    case 1:
                        _a = _b.sent();
                        return [3, 4];
                    case 2: return [4, this.handleRequest(receiveData)];
                    case 3:
                        _a = _b.sent();
                        _b.label = 4;
                    case 4:
                        content = _a;
                        content = Array.isArray(receiveData)
                            ? content.filter(function (item) { return !!item; })
                            : content;
                        if (Array.isArray(receiveData) && receiveData.length === 0) {
                            this.send({
                                jsonrpc: this.version,
                                error: exports.ERROR_CODEs.InvalidRequest,
                                id: id
                            });
                        }
                        else if (Array.isArray(content) && content.length === 0) {
                            return [2];
                        }
                        else if (!!content) {
                            this.send(content);
                        }
                        return [2];
                }
            });
        });
    };
    JsonRpc2.prototype.handleRequest = function (res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, method, paramsKeys, type, content, result, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (res.jsonrpc !== this.version || typeof res !== "object") {
                            return [2, {
                                    jsonrpc: this.version,
                                    error: exports.ERROR_CODEs.InvalidRequest,
                                    id: res.id
                                }];
                        }
                        if (!(res.method && this.registerRpcCallMap.has(res.method))) return [3, 5];
                        _a = this.registerRpcCallMap.get(res.method), method = _a.method, paramsKeys = _a.paramsKeys, type = _a.type;
                        content = void 0;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4, (Array.isArray(res.params)
                                ? method.apply(void 0, res.params) : method.apply(void 0, paramsKeys.map(function (key) { return res.params[key]; })))];
                    case 2:
                        result = _b.sent();
                        content = {
                            jsonrpc: this.version,
                            result: result,
                            id: res.id
                        };
                        return [3, 4];
                    case 3:
                        error_1 = _b.sent();
                        content = {
                            jsonrpc: this.version,
                            error: exports.ERROR_CODEs.InternalError,
                            id: res.id
                        };
                        return [3, 4];
                    case 4: return [2, type ? undefined : content];
                    case 5:
                        if (res.method && !this.registerRpcCallMap.has(res.method)) {
                            return [2, {
                                    jsonrpc: this.version,
                                    error: exports.ERROR_CODEs.MethodNotFound,
                                    id: res.id
                                }];
                        }
                        return [2, {
                                jsonrpc: this.version,
                                error: exports.ERROR_CODEs.InvalidRequest,
                                id: res.id
                            }];
                }
            });
        });
    };
    JsonRpc2.prototype.handleResponse = function (res) {
        var id = res.id, result = res.result, error = res.error;
        var _a = this.waitForResult.get(id), successCall = _a.successCall, failCall = _a.failCall;
        this.waitForResult["delete"](id);
        return result ? successCall(result) : failCall(error);
    };
    JsonRpc2.prototype.timeoutHandle = function () {
        var _this = this;
        if (this.timeoutId) {
            return;
        }
        this.timeoutId = setTimeout(function () {
            _this.timeoutId = null;
            Object.keys(_this.waitForResult).forEach(function (key) {
                var _a = _this.waitForResult.get(key), createdAt = _a.createdAt, failCall = _a.failCall;
                var duration = (new Date().getTime() - createdAt.getTime()) / 1000;
                if (duration > _this.timeout) {
                    _this.handleResponse({
                        jsonrpc: _this.version,
                        error: exports.ERROR_CODEs.Timeout,
                        id: key
                    });
                }
            });
        }, this.timeout);
    };
    JsonRpc2.prototype.call = function (method, params) {
        return __awaiter(this, void 0, void 0, function () {
            var id, content, result;
            var _this = this;
            return __generator(this, function (_a) {
                id = uuid_1.v4();
                content = {
                    jsonrpc: this.version,
                    method: method,
                    params: params,
                    id: id
                };
                result = new Promise(function (resolve, reject) {
                    return _this.waitForResult.set(id, {
                        successCall: resolve,
                        failCall: reject,
                        createdAt: new Date()
                    });
                });
                this.send(content);
                this.timeoutHandle();
                return [2, result];
            });
        });
    };
    JsonRpc2.prototype.bulkCall = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var results;
            var _this = this;
            return __generator(this, function (_a) {
                results = args.map(function (_a) {
                    var method = _a.method, params = _a.params;
                    return _this.call(method, params);
                });
                return [2, Promise.allSettled(results)];
            });
        });
    };
    JsonRpc2.prototype.notify = function (method, params) {
        var content = {
            jsonrpc: this.version,
            method: method,
            params: params
        };
        this.send(content);
    };
    return JsonRpc2;
}());
exports.JsonRpc2 = JsonRpc2;
