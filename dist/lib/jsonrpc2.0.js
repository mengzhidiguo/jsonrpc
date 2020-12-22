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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonRpc2 = exports.ERROR_CODEs = void 0;
const uuid_1 = require("uuid");
exports.ERROR_CODEs = {
    ParseError: { code: -32700, msg: "语法解析错误" },
    InvalidRequest: { code: -32600, msg: "无效请求" },
    MethodNotFound: { code: -32601, msg: "找不到方法" },
    InvalidParams: { code: -32602, msg: "无效的参数" },
    InternalError: { code: -32603, msg: "内部错误" },
    Timeout: { code: -32000, msg: "超时，没有收到可辨认的回复" },
};
class JsonRpc2 {
    constructor(options) {
        this.version = "2.0";
        this.registerRpcCallMap = new Map();
        this.waitForResult = new Map();
        const { send, timeout } = options;
        this.timeout = timeout || 60;
        this.send = (msg) => {
            send(typeof msg === "string" ? msg : JSON.stringify(msg));
        };
    }
    registerRpcCall(methodName, method, paramsKeys) {
        this.registerRpcCallMap.set(methodName, { method, paramsKeys });
    }
    registerRpcNotifyCall(methodName, method, paramsKeys) {
        this.registerRpcCallMap.set(methodName, {
            method,
            paramsKeys,
            type: "notify",
        });
    }
    unregisterRpcCall(methodName) {
        this.registerRpcCallMap.delete(methodName);
    }
    receive(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let receiveData;
            try {
                receiveData = typeof data === "string" ? JSON.parse(data) : data;
            }
            catch (error) {
                console.log("不理解的消息:", error.message);
                return this.send({
                    jsonrpc: this.version,
                    error: exports.ERROR_CODEs.ParseError,
                    id: null,
                });
            }
            const id = receiveData.id;
            if (receiveData.jsonrpc === this.version &&
                (receiveData.result || receiveData.error) &&
                id != null &&
                id !== undefined &&
                this.waitForResult.has(id)) {
                return this.handleResponse(receiveData);
            }
            let content = Array.isArray(receiveData)
                ? yield Promise.all(receiveData.map((r) => this.handleRequest(r)))
                : yield this.handleRequest(receiveData);
            content = Array.isArray(receiveData)
                ? content.filter((item) => !!item)
                : content;
            if (Array.isArray(receiveData) && receiveData.length === 0) {
                this.send({
                    jsonrpc: this.version,
                    error: exports.ERROR_CODEs.InvalidRequest,
                    id,
                });
            }
            else if (Array.isArray(content) && content.length === 0) {
                return;
            }
            else if (!!content) {
                this.send(content);
            }
        });
    }
    handleRequest(res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (res.jsonrpc !== this.version || typeof res !== "object") {
                return {
                    jsonrpc: this.version,
                    error: exports.ERROR_CODEs.InvalidRequest,
                    id: res.id,
                };
            }
            if (res.method && this.registerRpcCallMap.has(res.method)) {
                const { method, paramsKeys, type } = this.registerRpcCallMap.get(res.method);
                let content;
                try {
                    const result = yield (Array.isArray(res.params)
                        ? method(...res.params)
                        : method(...paramsKeys.map((key) => res.params[key])));
                    content = {
                        jsonrpc: this.version,
                        result,
                        id: res.id,
                    };
                }
                catch (error) {
                    content = {
                        jsonrpc: this.version,
                        error: exports.ERROR_CODEs.InternalError,
                        id: res.id,
                    };
                }
                return type ? undefined : content;
            }
            if (res.method && !this.registerRpcCallMap.has(res.method)) {
                return {
                    jsonrpc: this.version,
                    error: exports.ERROR_CODEs.MethodNotFound,
                    id: res.id,
                };
            }
            return {
                jsonrpc: this.version,
                error: exports.ERROR_CODEs.InvalidRequest,
                id: res.id,
            };
        });
    }
    handleResponse(res) {
        const { id, result, error } = res;
        const { successCall, failCall } = this.waitForResult.get(id);
        this.waitForResult.delete(id);
        return result ? successCall(result) : failCall(error);
    }
    timeoutHandle() {
        if (this.timeoutId) {
            return;
        }
        this.timeoutId = setTimeout(() => {
            this.timeoutId = null;
            Object.keys(this.waitForResult).forEach((key) => {
                const { createdAt, failCall } = this.waitForResult.get(key);
                const duration = (new Date().getTime() - createdAt.getTime()) / 1000;
                if (duration > this.timeout) {
                    this.handleResponse({
                        jsonrpc: this.version,
                        error: exports.ERROR_CODEs.Timeout,
                        id: key,
                    });
                }
            });
        }, this.timeout);
    }
    call(method, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = uuid_1.v4();
            const content = {
                jsonrpc: this.version,
                method,
                params,
                id,
            };
            const result = new Promise((resolve, reject) => this.waitForResult.set(id, {
                successCall: resolve,
                failCall: reject,
                createdAt: new Date(),
            }));
            this.send(content);
            this.timeoutHandle();
            return result;
        });
    }
    bulkCall(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = args.map(({ method, params }) => this.call(method, params));
            return Promise.allSettled(results);
        });
    }
    notify(method, params) {
        const content = {
            jsonrpc: this.version,
            method,
            params,
        };
        this.send(content);
    }
}
exports.JsonRpc2 = JsonRpc2;
