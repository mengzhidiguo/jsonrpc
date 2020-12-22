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
const index_1 = require("../index");
function testResponse() {
    return __awaiter(this, void 0, void 0, function* () {
        console.group("本地注册函数，接受调用");
        function sendResponse(msg) {
            console.log(msg);
        }
        const rpcResponse = new index_1.JsonRpc2({
            timeout: 1000,
            send: sendResponse,
        });
        function subtract(a, b) {
            return a - b;
        }
        function notify(...args) {
            console.log("notification", args);
        }
        rpcResponse.registerRpcCall("subtract", subtract, ["a", "b"]);
        rpcResponse.registerRpcNotifyCall("notify", notify, ["a", "b"]);
        rpcResponse.receive(JSON.stringify({
            jsonrpc: "2.0",
            method: "subtract",
            params: [42, 23],
            id: 1,
        }));
        rpcResponse.receive(JSON.stringify({
            jsonrpc: "2.0",
            method: "subtract",
            params: { a: 23, b: 42 },
            id: 2,
        }));
        rpcResponse.receive(JSON.stringify({
            jsonrpc: "2.0",
            method: "notify",
            params: [1, 2, 3, 4, 5],
        }));
        rpcResponse.receive(JSON.stringify({ jsonrpc: "2.0", method: "foobar", id: "5" }));
        rpcResponse.receive('{"jsonrpc": "2.0", "method": "foobar, "params": "bar", "baz]');
        rpcResponse.receive(JSON.stringify({ jsonrpc: "2.0", method: 1, params: "bar" }));
        rpcResponse.receive(`[
    {"jsonrpc": "2.0", "method": "sum", "params": [1,2,4], "id": "1"},
    {"jsonrpc": "2.0", "method"
]`);
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
                id: "5",
            },
            { jsonrpc: "2.0", method: "get_data", id: "9" },
        ]));
        rpcResponse.receive(JSON.stringify([
            { jsonrpc: "2.0", method: "notify", params: [1, 2, 4] },
            { jsonrpc: "2.0", method: "notify", params: [7] },
        ]));
        setTimeout(() => {
            console.groupEnd();
        }, 1000);
    });
}
function testRequest() {
    return __awaiter(this, void 0, void 0, function* () {
        console.group("本地调用远程函数");
        function sendRequest(msg) {
            rpcRequest.receive(msg);
        }
        const rpcRequest = new index_1.JsonRpc2({
            timeout: 1000,
            send: sendRequest,
        });
        function subtract1(a, b) {
            return a - b;
        }
        function notify1(...args) { }
        rpcRequest.registerRpcCall("subtract", subtract1, ["a", "b"]);
        rpcRequest.registerRpcNotifyCall("notify", notify1, ["a", "b"]);
        let res = yield rpcRequest
            .call("subtract", [42, 23])
            .catch((err) => err)
            .catch((err) => err);
        console.log("带索引数组参数的rpc调用:", res);
        res = yield rpcRequest.call("subtract", { a: 23, b: 42 }).catch((err) => err);
        console.log("带关联数组参数的rpc调用:", res);
        res = rpcRequest.call("notify", [1, 2, 3, 4, 5]).catch((err) => err);
        console.log("通知", res);
        res = yield rpcRequest.call("foobar").catch((err) => err);
        console.log("不包含调用方法的rpc调用:", res);
        res = yield rpcRequest.bulkCall().catch((err) => err);
        console.log("包含空数组的rpc调用:", res);
        res = yield rpcRequest
            .bulkCall({ method: "sum", params: [1, 2, 4] }, { method: "notify_hello", params: [7] }, { method: "subtract", params: [42, 23] }, { method: "sum", params: [1, 2, 4] })
            .catch((err) => err);
        console.log("rpc批量调用:", res);
        res = rpcRequest
            .bulkCall({ method: "notify", params: [1, 2, 4] }, { method: "notify", params: [7] })
            .catch((err) => err);
        console.log("所有都为通知的rpc批量调用:", res);
        setTimeout(() => {
            console.groupEnd();
        }, 1000);
    });
}
testResponse()
    .then(() => console.log("end"))
    .catch((err) => console.log("err", err));
testRequest()
    .then(() => console.log("end"))
    .catch((err) => console.log("err", err));
