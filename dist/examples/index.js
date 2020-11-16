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
var index_1 = require("../index");
function testResponse() {
    return __awaiter(this, void 0, void 0, function () {
        function sendResponse(msg) {
            console.log(msg);
        }
        function subtract(a, b) {
            return a - b;
        }
        function notify() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            console.log("notification", args);
        }
        var rpcResponse;
        return __generator(this, function (_a) {
            console.group("本地注册函数，接受调用");
            rpcResponse = new index_1.JsonRpc2({
                timeout: 1000,
                send: sendResponse
            });
            rpcResponse.registerRpcCall("subtract", subtract, ["a", "b"]);
            rpcResponse.registerRpcNotifyCall("notify", notify, ["a", "b"]);
            rpcResponse.receive(JSON.stringify({
                jsonrpc: "2.0",
                method: "subtract",
                params: [42, 23],
                id: 1
            }));
            rpcResponse.receive(JSON.stringify({
                jsonrpc: "2.0",
                method: "subtract",
                params: { a: 23, b: 42 },
                id: 2
            }));
            rpcResponse.receive(JSON.stringify({
                jsonrpc: "2.0",
                method: "notify",
                params: [1, 2, 3, 4, 5]
            }));
            rpcResponse.receive(JSON.stringify({ jsonrpc: "2.0", method: "foobar", id: "5" }));
            rpcResponse.receive('{"jsonrpc": "2.0", "method": "foobar, "params": "bar", "baz]');
            rpcResponse.receive(JSON.stringify({ jsonrpc: "2.0", method: 1, params: "bar" }));
            rpcResponse.receive("[\n    {\"jsonrpc\": \"2.0\", \"method\": \"sum\", \"params\": [1,2,4], \"id\": \"1\"},\n    {\"jsonrpc\": \"2.0\", \"method\"\n]");
            rpcResponse.receive(JSON.stringify([]));
            rpcResponse.receive(JSON.stringify([1]));
            rpcResponse.receive(JSON.stringify([
                { jsonrpc: "2.0", method: "sum", params: [1, 2, 4], id: "1" },
                { jsonrpc: "2.0", method: "notify_hello", params: [7] },
                { jsonrpc: "2.0", method: "subtract", params: [42, 23], id: "2" },
                { foo: "boo" },
                {
                    jsonrpc: "2.0",
                    method: "foo.get",
                    params: { name: "myself" },
                    id: "5"
                },
                { jsonrpc: "2.0", method: "get_data", id: "9" },
            ]));
            rpcResponse.receive(JSON.stringify([
                { jsonrpc: "2.0", method: "notify", params: [1, 2, 4] },
                { jsonrpc: "2.0", method: "notify", params: [7] },
            ]));
            setTimeout(function () {
                console.groupEnd();
            }, 1000);
            return [2];
        });
    });
}
function testRequest() {
    return __awaiter(this, void 0, void 0, function () {
        function sendRequest(msg) {
            rpcRequest.receive(msg);
        }
        function subtract1(a, b) {
            return a - b;
        }
        function notify1() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
        }
        var rpcRequest, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.group("本地调用远程函数");
                    rpcRequest = new index_1.JsonRpc2({
                        timeout: 1000,
                        send: sendRequest
                    });
                    rpcRequest.registerRpcCall("subtract", subtract1, ["a", "b"]);
                    rpcRequest.registerRpcNotifyCall("notify", notify1, ["a", "b"]);
                    return [4, rpcRequest
                            .call("subtract", [42, 23])["catch"](function (err) { return err; })["catch"](function (err) { return err; })];
                case 1:
                    res = _a.sent();
                    console.log("带索引数组参数的rpc调用:", res);
                    return [4, rpcRequest.call("subtract", { a: 23, b: 42 })["catch"](function (err) { return err; })];
                case 2:
                    res = _a.sent();
                    console.log("带关联数组参数的rpc调用:", res);
                    res = rpcRequest.call("notify", [1, 2, 3, 4, 5])["catch"](function (err) { return err; });
                    console.log("通知", res);
                    return [4, rpcRequest.call("foobar")["catch"](function (err) { return err; })];
                case 3:
                    res = _a.sent();
                    console.log("不包含调用方法的rpc调用:", res);
                    return [4, rpcRequest.bulkCall()["catch"](function (err) { return err; })];
                case 4:
                    res = _a.sent();
                    console.log("包含空数组的rpc调用:", res);
                    return [4, rpcRequest
                            .bulkCall({ method: "sum", params: [1, 2, 4] }, { method: "notify_hello", params: [7] }, { method: "subtract", params: [42, 23] }, { method: "sum", params: [1, 2, 4] })["catch"](function (err) { return err; })];
                case 5:
                    res = _a.sent();
                    console.log("rpc批量调用:", res);
                    res = rpcRequest
                        .bulkCall({ method: "notify", params: [1, 2, 4] }, { method: "notify", params: [7] })["catch"](function (err) { return err; });
                    console.log("所有都为通知的rpc批量调用:", res);
                    setTimeout(function () {
                        console.groupEnd();
                    }, 1000);
                    return [2];
            }
        });
    });
}
testResponse()
    .then(function () { return console.log("end"); })["catch"](function (err) { return console.log("err", err); });
testRequest()
    .then(function () { return console.log("end"); })["catch"](function (err) { return console.log("err", err); });
